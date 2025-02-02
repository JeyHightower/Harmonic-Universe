"""WebSocket handler module."""

from typing import List
from fastapi import WebSocket, WebSocketDisconnect
from app.core.config import settings
import logging
import json

logger = logging.getLogger(__name__)

class ConnectionManager:
    """WebSocket connection manager."""

    def __init__(self):
        """Initialize the connection manager."""
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        """Connect a WebSocket client."""
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"Client connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        """Disconnect a WebSocket client."""
        self.active_connections.remove(websocket)
        logger.info(f"Client disconnected. Total connections: {len(self.active_connections)}")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        """Send a message to a specific client."""
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        """Broadcast a message to all connected clients."""
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except WebSocketDisconnect:
                await self.disconnect(connection)
            except Exception as e:
                logger.error(f"Error broadcasting message: {str(e)}")

    async def broadcast_json(self, data: dict):
        """Broadcast JSON data to all connected clients."""
        message = json.dumps(data)
        await self.broadcast(message)

manager = ConnectionManager()

async def handle_websocket(websocket: WebSocket):
    """Handle WebSocket connections and messages."""
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                # Handle different message types
                if message.get("type") == "chat":
                    await manager.broadcast_json({
                        "type": "chat",
                        "data": {
                            "user": message.get("user", "Anonymous"),
                            "message": message.get("message", ""),
                            "timestamp": message.get("timestamp")
                        }
                    })
                elif message.get("type") == "status":
                    await manager.broadcast_json({
                        "type": "status",
                        "data": {
                            "user": message.get("user", "Anonymous"),
                            "status": message.get("status", "online")
                        }
                    })
            except json.JSONDecodeError:
                await manager.send_personal_message(
                    "Invalid message format. Please send JSON.", websocket
                )
            except Exception as e:
                logger.error(f"Error handling message: {str(e)}")
                await manager.send_personal_message(
                    "Error processing message.", websocket
                )
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        await manager.broadcast_json({
            "type": "system",
            "data": {
                "message": "Client disconnected",
                "connections": len(manager.active_connections)
            }
        })
