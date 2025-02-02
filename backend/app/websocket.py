from fastapi import WebSocket, WebSocketDisconnect, Depends
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime, timedelta
from collections import defaultdict
import json
from pydantic import BaseModel, ValidationError
from flask_socketio import SocketIO
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

# Initialize SocketIO with enhanced monitoring
socketio = SocketIO(
    cors_allowed_origins=settings.CORS_ORIGINS,
    async_mode='asgi',
    logger=settings.DEBUG,
    engineio_logger=settings.DEBUG,
    monitor_clients=True
)

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
        self._metrics_lock = Lock()  # Use asyncio.Lock instead of threading.Lock

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

    async def monitor_connection(self, websocket: WebSocket, client_id: str):
        """Monitor connection health and performance."""
        while client_id in self.active_connections:
            try:
                # Check connection quality
                quality = await self.assess_connection_quality(client_id)
                client_states[client_id]['connection_quality'] = quality

                # Collect and analyze metrics
                metrics = await self.collect_metrics(client_id)
                await self.analyze_metrics(metrics, client_id)

                # Update metrics history
                self.metrics_history.append(metrics)
                if len(self.metrics_history) > 1000:  # Keep last 1000 metrics
                    self.metrics_history.pop(0)

                # Alert if necessary
                await self.check_alerts(metrics, client_id)

                await asyncio.sleep(5)  # Check every 5 seconds
            except Exception as e:
                logger.error(f"Monitoring error for client {client_id}: {str(e)}")

    async def assess_connection_quality(self, client_id: str) -> float:
        """Assess connection quality based on multiple factors."""
        state = client_states[client_id]

        # Calculate factors
        latency_factor = self.calculate_latency_factor(state['latency_history'])
        error_factor = self.calculate_error_factor(state['error_history'])
        reconnect_factor = max(0, 1 - (state['reconnect_attempts'] * 0.1))

        # Weighted average
        quality = (
            latency_factor * 0.4 +
            error_factor * 0.4 +
            reconnect_factor * 0.2
        )

        return max(0, min(1, quality))

    def calculate_latency_factor(self, latency_history: List[float]) -> float:
        if not latency_history:
            return 1.0
        avg_latency = sum(latency_history) / len(latency_history)
        return max(0, 1 - (avg_latency / PERFORMANCE_THRESHOLDS['LATENCY']['CRITICAL']))

    def calculate_error_factor(self, error_history: List[Tuple[datetime, str]]) -> float:
        recent_errors = [e for e in error_history if
                        (datetime.now() - e[0]).total_seconds() < 300]  # Last 5 minutes
        error_rate = len(recent_errors) / 5 if recent_errors else 0
        return max(0, 1 - (error_rate / PERFORMANCE_THRESHOLDS['ERROR_RATE']['CRITICAL']))

    async def collect_metrics(self, client_id: str) -> WebSocketMetrics:
        """Collect comprehensive metrics for a connection with thread safety."""
        with self._metrics_lock:  # Use with instead of async with for threading.Lock
            state = client_states[client_id]
            now = datetime.now()
            time_window = (now - self.last_metrics_check).total_seconds() / 60

            # Calculate rates with bounds checking
            message_rate = (
                sum(state['message_counts'].values()) / max(time_window, 0.1)
                if state['message_counts']
                else 0
            )

            error_rate = (
                len([e for e in state['error_history']
                     if (now - e[0]).total_seconds() < 60]) / max(time_window, 0.1)
                if state['error_history']
                else 0
            )

            # Calculate latency with bounds checking
            recent_latency = state['latency_history'][-10:] if state['latency_history'] else []
            avg_latency = (
                sum(recent_latency) / len(recent_latency)
                if recent_latency
                else 0
            )

            metrics = WebSocketMetrics(
                latency=avg_latency,
                message_rate=message_rate,
                error_rate=error_rate,
                reconnect_rate=state['reconnect_attempts'] / max(time_window, 0.1),
                connection_quality=state['connection_quality'],
                bandwidth_usage=state['bandwidth_usage'],
                timestamp=now
            )

            # Update metrics history with size limit
            self.metrics_history.append(metrics)
            if len(self.metrics_history) > 1000:
                self.metrics_history = self.metrics_history[-1000:]

            # Update last_metrics_check to current time
            self.last_metrics_check = now

            return metrics

    async def analyze_metrics(self, metrics: WebSocketMetrics, client_id: str):
        """Analyze metrics and take action if necessary."""
        if metrics.connection_quality < 0.5:
            logger.warning(f"Poor connection quality for client {client_id}: {metrics.connection_quality}")
            await self.attempt_connection_optimization(client_id)

        if metrics.error_rate > PERFORMANCE_THRESHOLDS['ERROR_RATE']['WARNING']:
            logger.warning(f"High error rate for client {client_id}: {metrics.error_rate}/minute")

        if metrics.latency > PERFORMANCE_THRESHOLDS['LATENCY']['WARNING']:
            logger.warning(f"High latency for client {client_id}: {metrics.latency}ms")

    async def attempt_connection_optimization(self, client_id: str):
        """Attempt to optimize poor connections."""
        state = client_states[client_id]

        # Implement progressive enhancement/degradation
        if state['connection_quality'] < 0.3:
            # Severe quality issues - reduce message frequency
            await self.send_optimization_command(client_id, 'reduce_frequency')
        elif state['connection_quality'] < 0.6:
            # Moderate quality issues - compress messages
            await self.send_optimization_command(client_id, 'enable_compression')

        # Update recovery metrics
        state['last_recovery_attempt'] = datetime.now()

    async def send_optimization_command(self, client_id: str, command: str):
        """Send optimization commands to client."""
        try:
            websocket = self.active_connections.get(client_id)
            if websocket:
                await websocket.send_json({
                    'event': 'connection_optimization',
                    'data': {
                        'command': command,
                        'timestamp': datetime.now().isoformat()
                    }
                })
        except Exception as e:
            logger.error(f"Failed to send optimization command to client {client_id}: {str(e)}")

    async def check_alerts(self, metrics: WebSocketMetrics, client_id: str):
        """Check metrics against thresholds and send alerts if necessary."""
        alerts = []

        if metrics.latency > PERFORMANCE_THRESHOLDS['LATENCY']['CRITICAL']:
            alerts.append(('CRITICAL', f"Critical latency: {metrics.latency}ms"))
        elif metrics.latency > PERFORMANCE_THRESHOLDS['LATENCY']['WARNING']:
            alerts.append(('WARNING', f"High latency: {metrics.latency}ms"))

        if metrics.error_rate > PERFORMANCE_THRESHOLDS['ERROR_RATE']['CRITICAL']:
            alerts.append(('CRITICAL', f"Critical error rate: {metrics.error_rate}/minute"))
        elif metrics.error_rate > PERFORMANCE_THRESHOLDS['ERROR_RATE']['WARNING']:
            alerts.append(('WARNING', f"High error rate: {metrics.error_rate}/minute"))

        for level, message in alerts:
            logger.warning(f"[{level}] Client {client_id}: {message}")
            await self.notify_monitoring_service(client_id, level, message, metrics)

    async def notify_monitoring_service(self, client_id: str, level: str, message: str, metrics: WebSocketMetrics):
        """Notify monitoring service of issues."""
        try:
            # Send alert to monitoring service
            alert_data = {
                'client_id': client_id,
                'level': level,
                'message': message,
                'metrics': metrics.dict(),
                'timestamp': datetime.now().isoformat()
            }
            # Your monitoring service integration here
            logger.info(f"Alert sent to monitoring service: {alert_data}")
        except Exception as e:
            logger.error(f"Failed to send alert to monitoring service: {str(e)}")

    async def recover_state(self, websocket: WebSocket, client_id: str):
        """Recover client state after reconnection."""
        try:
            last_state = client_states[client_id]['last_known_state']
            if last_state:
                await websocket.send_json({
                    'event': 'state_recovery',
                    'data': {
                        'state': last_state,
                        'sequence_number': client_states[client_id]['last_sequence_number'],
                        'timestamp': datetime.now().isoformat()
                    }
                })

                # Rejoin rooms
                for room in client_states[client_id]['rooms']:
                    await self.join_room(room, client_id)
        except Exception as e:
            logger.error(f"State recovery failed for client {client_id}: {str(e)}")
            await self.handle_error(websocket, "State recovery failed", ErrorCode.WEBSOCKET_CONNECTION_ERROR)

    async def join_room(self, room: str, client_id: str):
        """Join a room."""
        if client_id in self.active_connections:
            websocket = self.active_connections[client_id]
            self.rooms[room].append(websocket)
            client_states[client_id]['rooms'].add(room)
            logger.info(f"Client {client_id} joined room {room}")

    async def leave_room(self, room: str, client_id: str):
        """Leave a room."""
        if client_id in self.active_connections:
            websocket = self.active_connections[client_id]
            if websocket in self.rooms[room]:
                self.rooms[room].remove(websocket)
                client_states[client_id]['rooms'].remove(room)
                logger.info(f"Client {client_id} left room {room}")

    async def broadcast(self, message: dict, room: Optional[str] = None, sender_id: Optional[str] = None):
        """Broadcast message with sequence numbers."""
        if sender_id and sender_id in client_states:
            message['sequence_number'] = client_states[sender_id]['last_sequence_number'] + 1
            client_states[sender_id]['last_sequence_number'] += 1

        try:
            if room:
                for connection in self.rooms[room]:
                    await connection.send_json(message)
            else:
                for connection in self.active_connections.values():
                    await connection.send_json(message)
        except Exception as e:
            logger.error(f"Broadcast error: {str(e)}")
            # Handle failed connections
            await self.cleanup_failed_connections()

    async def cleanup_failed_connections(self):
        """Clean up failed connections."""
        failed_clients = []
        for client_id, websocket in self.active_connections.items():
            try:
                # Test connection with a ping
                await websocket.send_json({"type": "ping"})
            except Exception:
                failed_clients.append(client_id)

        for client_id in failed_clients:
            self.disconnect(client_id)

    async def cleanup_old_metrics(self):
        """Clean up old metrics data periodically."""
        with self._metrics_lock:  # Use with instead of async with for threading.Lock
            now = datetime.now()
            for client_id in client_states:
                state = client_states[client_id]

                # Clean up latency history (keep last hour)
                state['latency_history'] = [
                    lat for lat in state['latency_history'][-3600:]
                ]

                # Clean up error history (keep last hour)
                state['error_history'] = [
                    err for err in state['error_history']
                    if (now - err[0]).total_seconds() < 3600
                ]

                # Clean up message counts (reset if too old)
                if (now - state.get('last_message_count_reset', now)).total_seconds() > 3600:
                    state['message_counts'] = defaultdict(int)
                    state['last_message_count_reset'] = now

    def disconnect(self, client_id: str):
        """Handle client disconnection with state preservation and cleanup."""
        if client_id in self.active_connections:
            # Cache state before disconnection
            self.state_cache[client_id] = client_states[client_id]['last_known_state']

            # Clean up rooms
            for room in list(client_states[client_id]['rooms']):
                if self.active_connections[client_id] in self.rooms[room]:
                    self.rooms[room].remove(self.active_connections[client_id])

            # Update connection metrics
            connection_metrics['active_connections'] -= 1

            # Clean up connection
            del self.active_connections[client_id]

        client_states[client_id]['connected'] = False
        client_states[client_id]['reconnect_attempts'] += 1

        # Keep room information for potential reconnection
        if client_id in client_states:
            client_states[client_id]['rooms'] = set(client_states[client_id]['rooms'])

        # Clean up old cache entries
        self._cleanup_state_cache()

    def _cleanup_state_cache(self):
        """Clean up old state cache entries."""
        now = datetime.now()
        expired_clients = [
            client_id for client_id, state in self.state_cache.items()
            if client_id not in self.active_connections and
            (now - client_states[client_id].get('last_heartbeat', now)).total_seconds() > 3600
        ]
        for client_id in expired_clients:
            del self.state_cache[client_id]

    async def handle_error(self, websocket: WebSocket, message: str, error_code: str):
        """Standardized error handling."""
        try:
            await websocket.send_json({
                'event': 'error',
                'data': {
                    'code': error_code,
                    'message': message,
                    'timestamp': datetime.now().isoformat()
                }
            })
        except Exception as e:
            logger.error(f"Error sending error message: {str(e)}")

manager = ConnectionManager()

async def get_token(websocket: WebSocket, client_id: str) -> Optional[str]:
    """Extract and validate token from WebSocket query parameters."""
    try:
        token = websocket.query_params.get('token')
        if token:
            payload = verify_jwt_token(token)
            user_id = payload.get('sub')
            if user_id:
                client_states[client_id]['user_id'] = user_id
                return token
    except Exception as e:
        logger.error(f"Token validation failed: {str(e)}")
        return None
    return None

async def handle_websocket(websocket: WebSocket):
    """Main WebSocket handler with improved error handling and recovery."""
    token = await get_token(websocket, f"client_{id(websocket)}")
    if not token:
        await websocket.close(code=4001, reason="Authentication required")
        return

    client_id = f"client_{id(websocket)}"
    try:
        await manager.connect(websocket, client_id)
        await websocket.send_json({
            'event': 'connected',
            'data': {
                'message': 'Connected successfully',
                'client_id': client_id,
                'timestamp': datetime.now().isoformat()
            }
        })

        while True:
            try:
                data = await websocket.receive_json()
                message = WebSocketMessage(**data)

                # Rate limiting check
                now = datetime.now()
                client_data = client_message_counts[client_id]
                if now - client_data['reset_time'] > timedelta(seconds=RATE_LIMIT_WINDOW):
                    client_data['count'] = 0
                    client_data['reset_time'] = now
                if client_data['count'] >= RATE_LIMIT:
                    await manager.handle_error(
                        websocket,
                        "Rate limit exceeded",
                        ErrorCode.WEBSOCKET_RATE_LIMIT
                    )
                    continue

                client_data['count'] += 1

                # Update last known state
                if message.data.get('state'):
                    client_states[client_id]['last_known_state'] = message.data['state']

                # Handle different event types
                if message.event == 'join':
                    if message.room:
                        await manager.join_room(message.room, client_id)
                        await manager.broadcast({
                            'event': 'joined',
                            'data': {
                                'room': message.room,
                                'timestamp': datetime.now().isoformat()
                            }
                        }, room=message.room)

                elif message.event == 'leave':
                    if message.room:
                        await manager.leave_room(message.room, client_id)
                        await manager.broadcast({
                            'event': 'left',
                            'data': {
                                'room': message.room,
                                'timestamp': datetime.now().isoformat()
                            }
                        }, room=message.room)

                elif message.event == 'heartbeat':
                    client_states[client_id]['last_heartbeat'] = datetime.now()
                    await websocket.send_json({
                        'event': 'heartbeat_ack',
                        'data': {
                            'timestamp': datetime.now().isoformat()
                        }
                    })

                elif message.event in ['scene_update', 'parameter_update', 'timeline_update']:
                    if message.room:
                        await manager.broadcast({
                            'event': f"{message.event}d",
                            'data': {
                                **message.data,
                                'timestamp': datetime.now().isoformat()
                            }
                        }, room=message.room)

            except ValidationError as e:
                await manager.handle_error(
                    websocket,
                    str(e),
                    ErrorCode.VALIDATION_ERROR
                )
            except json.JSONDecodeError:
                await manager.handle_error(
                    websocket,
                    "Invalid JSON data",
                    ErrorCode.WEBSOCKET_CONNECTION_ERROR
                )

    except WebSocketDisconnect:
        manager.disconnect(client_id)
        logger.info(f"Client {client_id} disconnected")
    except Exception as e:
        logger.error(f"WebSocket error for client {client_id}: {str(e)}")
        await manager.handle_error(
            websocket,
            str(e),
            ErrorCode.WEBSOCKET_CONNECTION_ERROR
        )
        manager.disconnect(client_id)

@socketio.on('connect')
async def handle_connect(websocket: WebSocket, auth: Optional[Dict[str, str]] = None):
    """Handle client connection."""
    if not auth or 'token' not in auth:
        await websocket.close(code=4001, reason="Authentication required")
        return

    try:
        # Verify token
        payload = verify_jwt_token(auth['token'])
        user_id = payload.get('sub')

        if not user_id:
            await websocket.close(code=4001, reason="Invalid token")
            return

        # Store connection
        connections[user_id] = websocket
        logger.info(f"Client connected: {user_id}")

        await websocket.send_json({
            'event': 'connected',
            'data': {
                'message': 'Connected successfully',
                'user_id': user_id,
                'timestamp': datetime.now().isoformat()
            }
        })
    except Exception as e:
        logger.error(f"Connection error: {str(e)}")
        await websocket.close(code=4001, reason="Connection error")

@socketio.on('disconnect')
async def handle_disconnect(websocket: WebSocket):
    """Handle client disconnection."""
    user_id = None

    # Find and remove the connection
    for uid, conn_websocket in connections.items():
        if conn_websocket == websocket:
            user_id = uid
            del connections[uid]
            break

    if user_id:
        logger.info(f"Client disconnected: {user_id}")

@socketio.on('message')
async def handle_message(websocket: WebSocket, data: Dict[str, Any]):
    """Handle incoming messages."""
    try:
        # Process message
        response = await process_message(data)

        # Broadcast response if needed
        if response.get('broadcast'):
            await socketio.emit('message', response['data'], room=response.get('room'))
        else:
            await websocket.send_json(response['data'])
    except Exception as e:
        logger.error(f"Message handling error: {str(e)}")
        await websocket.send_json({'event': 'error', 'data': {'message': str(e)}})

async def process_message(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process incoming message and return response.

    Args:
        data: Message data

    Returns:
        Dict containing response data and broadcast settings
    """
    message_type = data.get('type')

    if message_type == 'scene_update':
        # Handle scene updates
        return {
            'data': {
                'type': 'scene_update_ack',
                'timestamp': datetime.utcnow().isoformat(),
                'status': 'success'
            },
            'broadcast': True,
            'room': data.get('scene_id')
        }
    elif message_type == 'parameter_update':
        # Handle parameter updates
        return {
            'data': {
                'type': 'parameter_update_ack',
                'timestamp': datetime.utcnow().isoformat(),
                'status': 'success'
            },
            'broadcast': True,
            'room': data.get('scene_id')
        }

    # Default response
    return {
        'data': {
            'type': 'message_ack',
            'timestamp': datetime.utcnow().isoformat(),
            'status': 'success'
        },
        'broadcast': False
    }

def get_connection(user_id: str) -> Optional[str]:
    """Get connection SID for user."""
    return connections.get(user_id)

def broadcast_to_scene(scene_id: str, data: Dict[str, Any]):
    """Broadcast message to all clients in a scene room."""
    socketio.emit('message', data, room=scene_id)
