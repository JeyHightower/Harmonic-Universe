"""WebSocket endpoints."""

from fastapi import WebSocket, WebSocketDisconnect, Depends
from typing import List, Dict
import asyncio
from app.core.security import verify_token
from app.api.deps import get_current_user

class ConnectionManager:
    """WebSocket connection manager."""

    def __init__(self):
        """Initialize connection manager."""
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        """Connect websocket."""
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    async def disconnect(self, websocket: WebSocket, user_id: str):
        """Disconnect websocket."""
        self.active_connections[user_id].remove(websocket)
        if not self.active_connections[user_id]:
            del self.active_connections[user_id]

    async def broadcast(self, message: str, user_id: str):
        """Broadcast message to all connections for user."""
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                await connection.send_text(message)

manager = ConnectionManager()

@router.websocket("/ws/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str):
    """WebSocket endpoint."""
    try:
        user = await verify_token(token)
        await manager.connect(websocket, str(user.id))
        try:
            while True:
                data = await websocket.receive_text()
                await manager.broadcast(f"Message: {data}", str(user.id))
        except WebSocketDisconnect:
            await manager.disconnect(websocket, str(user.id))
    except Exception as e:
        await websocket.close(code=1008, reason=str(e))
