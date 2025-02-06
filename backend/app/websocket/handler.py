"""
WebSocket handler for real-time communication.
"""

from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, Set
import json
import logging

logger = logging.getLogger(__name__)

# Store active connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, scene_id: int):
        await websocket.accept()
        if scene_id not in self.active_connections:
            self.active_connections[scene_id] = set()
        self.active_connections[scene_id].add(websocket)

    def disconnect(self, websocket: WebSocket, scene_id: int):
        if scene_id in self.active_connections:
            self.active_connections[scene_id].discard(websocket)
            if not self.active_connections[scene_id]:
                del self.active_connections[scene_id]

    async def broadcast(self, message: str, scene_id: int):
        if scene_id in self.active_connections:
            for connection in self.active_connections[scene_id]:
                try:
                    await connection.send_text(message)
                except WebSocketDisconnect:
                    self.disconnect(connection, scene_id)
                except Exception as e:
                    logger.error(f"Error broadcasting message: {e}")
                    self.disconnect(connection, scene_id)

manager = ConnectionManager()

async def handle_websocket(websocket: WebSocket, scene_id: int):
    """Handle WebSocket connections for a scene."""
    try:
        await manager.connect(websocket, scene_id)
        await manager.broadcast(
            json.dumps({
                "type": "user_joined",
                "scene_id": scene_id
            }),
            scene_id
        )

        try:
            while True:
                data = await websocket.receive_text()
                message = json.loads(data)

                # Handle different message types
                if message.get("type") == "physics_update":
                    # Broadcast physics updates to all clients in the scene
                    await manager.broadcast(data, scene_id)
                elif message.get("type") == "chat_message":
                    # Broadcast chat messages to all clients in the scene
                    await manager.broadcast(data, scene_id)
                else:
                    # Broadcast other messages
                    await manager.broadcast(data, scene_id)

        except WebSocketDisconnect:
            manager.disconnect(websocket, scene_id)
            await manager.broadcast(
                json.dumps({
                    "type": "user_left",
                    "scene_id": scene_id
                }),
                scene_id
            )
        except Exception as e:
            logger.error(f"Error in WebSocket connection: {e}")
            manager.disconnect(websocket, scene_id)

    except Exception as e:
        logger.error(f"Error establishing WebSocket connection: {e}")
        try:
            await websocket.close()
        except:
            pass
