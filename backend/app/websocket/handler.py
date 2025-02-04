from fastapi import WebSocket, WebSocketDisconnect, Depends
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime, timedelta
from collections import defaultdict
import json
from pydantic import BaseModel, ValidationError
import asyncio
import logging
import time
import threading
from asyncio import Lock

from .core.errors import (
    WebSocketError,
    ErrorCode,
    ErrorResponse,
    handle_validation_error
)
from .core.security import verify_jwt_token
from .core.config import settings
from .db.session import SessionLocal
from .models.user import User

# Configure logging
logger = logging.getLogger(__name__)

# Rate limiting
client_message_counts = defaultdict(lambda: {'count': 0, 'reset_time': datetime.now()})
RATE_LIMIT = 100  # messages per minute
RATE_LIMIT_WINDOW = 60  # seconds

# Enhanced connection metrics
connection_metrics = {
    'total_connections': 0,
    'active_connections': 0,
    'peak_connections': 0,
    'connection_history': [],
    'error_counts': defaultdict(int),
    'latency_history': [],
    'bandwidth_usage': defaultdict(int),
}

# Performance thresholds
PERFORMANCE_THRESHOLDS = {
    'LATENCY': {
        'WARNING': 100,  # ms
        'CRITICAL': 300  # ms
    },
    'MESSAGE_RATE': {
        'WARNING': 500,  # messages per minute
        'CRITICAL': 1000
    },
    'ERROR_RATE': {
        'WARNING': 5,    # errors per minute
        'CRITICAL': 15
    },
    'RECONNECT_RATE': {
        'WARNING': 3,    # reconnects per minute
        'CRITICAL': 10
    }
}

# Enhanced client state tracking
client_states = defaultdict(lambda: {
    'connected': False,
    'rooms': set(),
    'last_heartbeat': datetime.now(),
    'user_id': None,
    'last_known_state': {},
    'reconnect_attempts': 0,
    'last_sequence_number': 0,
    'connection_quality': 1.0,  # 0.0 to 1.0
    'latency_history': [],
    'error_history': [],
    'bandwidth_usage': 0,
    'message_counts': defaultdict(int),
    'last_recovery_attempt': None,
    'recovery_success_rate': 1.0
})

# Active connections
active_connections: Dict[str, WebSocket] = {}

# Store active connections
connections: Dict[str, WebSocket] = {}

class WebSocketMessage(BaseModel):
    """Base model for WebSocket messages."""
    event: str
    data: Dict[str, Any]
    room: Optional[str] = None
    sequence_number: Optional[int] = None  # Added for message ordering

class WebSocketMetrics(BaseModel):
    """Model for WebSocket performance metrics."""
    latency: float
    message_rate: float
    error_rate: float
    reconnect_rate: float
    connection_quality: float
    bandwidth_usage: int
    timestamp: datetime

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.rooms: Dict[str, List[WebSocket]] = defaultdict(list)
        self.state_cache: Dict[str, Dict[str, Any]] = {}
        self.metrics_history: List[WebSocketMetrics] = []
        self.last_metrics_check = datetime.now()
        self._metrics_lock = Lock()

    async def connect(self, websocket: WebSocket, client_id: str):
        try:
            await websocket.accept()
            self.active_connections[client_id] = websocket
            client_states[client_id]['connected'] = True
            client_states[client_id]['last_heartbeat'] = datetime.now()

            # Update connection metrics
            connection_metrics['total_connections'] += 1
            connection_metrics['active_connections'] += 1
            connection_metrics['peak_connections'] = max(
                connection_metrics['peak_connections'],
                connection_metrics['active_connections']
            )

            # Attempt state recovery if reconnecting
            if client_states[client_id]['reconnect_attempts'] > 0:
                await self.recover_state(websocket, client_id)

            client_states[client_id]['reconnect_attempts'] = 0

            # Start monitoring for this connection
            asyncio.create_task(self.monitor_connection(websocket, client_id))

        except Exception as e:
            logger.error(f"Connection error for client {client_id}: {str(e)}")
            connection_metrics['error_counts']['connection_error'] += 1
            raise WebSocketError(
                code=ErrorCode.WEBSOCKET_CONNECTION_ERROR,
                message="Failed to establish connection",
                details={"error": str(e)}
            )

    async def disconnect(self, client_id: str):
        """Handle client disconnection."""
        if client_id in self.active_connections:
            websocket = self.active_connections[client_id]
            try:
                await websocket.close()
            except Exception as e:
                logger.error(f"Error closing websocket for client {client_id}: {str(e)}")

            del self.active_connections[client_id]
            client_states[client_id]['connected'] = False
            connection_metrics['active_connections'] -= 1

            # Update rooms
            for room in client_states[client_id]['rooms']:
                if client_id in self.rooms[room]:
                    self.rooms[room].remove(client_id)

            # Log disconnection
            logger.info(f"Client {client_id} disconnected")

    async def broadcast(self, message: dict, room: Optional[str] = None, sender_id: Optional[str] = None):
        """Broadcast message to all clients in a room or all connected clients."""
        disconnected_clients = []
        target_clients = (
            self.rooms[room] if room
            else self.active_connections.keys()
        )

        for client_id in target_clients:
            if client_id != sender_id:  # Don't send back to sender
                try:
                    websocket = self.active_connections.get(client_id)
                    if websocket:
                        await websocket.send_json(message)
                        client_states[client_id]['message_counts']['received'] += 1
                except WebSocketDisconnect:
                    disconnected_clients.append(client_id)
                except Exception as e:
                    logger.error(f"Error broadcasting to client {client_id}: {str(e)}")
                    disconnected_clients.append(client_id)

        # Cleanup disconnected clients
        for client_id in disconnected_clients:
            await self.disconnect(client_id)

# Initialize the connection manager
manager = ConnectionManager()

async def handle_websocket(websocket: WebSocket):
    """Main WebSocket handler."""
    client_id = None
    try:
        # Accept the connection
        token = await get_token(websocket)
        if not token:
            await websocket.close(code=4001)
            return

        # Verify token and get user
        user = await verify_jwt_token(token)
        if not user:
            await websocket.close(code=4002)
            return

        client_id = str(user.id)
        await manager.connect(websocket, client_id)

        try:
            while True:
                data = await websocket.receive_json()
                try:
                    message = WebSocketMessage(**data)
                    # Process message based on event type
                    if message.event == "join_room":
                        await manager.join_room(message.room, client_id)
                    elif message.event == "leave_room":
                        await manager.leave_room(message.room, client_id)
                    elif message.event == "broadcast":
                        await manager.broadcast(message.data, message.room, client_id)
                    # Add more event handlers as needed

                except ValidationError as e:
                    await handle_validation_error(websocket, e)

        except WebSocketDisconnect:
            await manager.disconnect(client_id)

    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        if client_id:
            await manager.disconnect(client_id)

async def get_token(websocket: WebSocket) -> Optional[str]:
    """Extract token from WebSocket connection."""
    try:
        # Try to get token from query parameters
        token = websocket.query_params.get('token')
        if token:
            return token

        # Try to get token from headers
        auth_header = websocket.headers.get('authorization')
        if auth_header and auth_header.startswith('Bearer '):
            return auth_header.split(' ')[1]

    except Exception as e:
        logger.error(f"Error extracting token: {str(e)}")

    return None
