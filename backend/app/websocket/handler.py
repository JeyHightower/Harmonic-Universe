"""
WebSocket handler for real-time collaboration.
"""

from datetime import datetime
from typing import Dict, List, Optional, Set, Union
from fastapi import WebSocket, WebSocketDisconnect
from pydantic import BaseModel
import json
import logging
import asyncio
from ..models.user import User
from ..models.universe import Universe
from ..core.errors import NotFoundError, AuthorizationError

logger = logging.getLogger(__name__)

class CursorPosition(BaseModel):
    """Cursor position data."""
    x: float
    y: float
    timestamp: datetime
    user_id: int
    username: str
    color: str

class ChatMessage(BaseModel):
    """Chat message data."""
    id: int
    user_id: int
    username: str
    content: str
    timestamp: datetime
    type: str = "message"  # message, system, error

class Comment(BaseModel):
    """Comment data."""
    id: int
    user_id: int
    username: str
    content: str
    timestamp: datetime
    position: Dict[str, float]
    resolved: bool = False

class Operation(BaseModel):
    """Operation for operational transformation."""
    type: str
    path: str
    value: Any
    timestamp: datetime
    user_id: int
    version: int

class CollaborationState(BaseModel):
    """State for a collaborative session."""
    cursors: Dict[int, CursorPosition] = {}
    chat_messages: List[ChatMessage] = []
    comments: List[Comment] = []
    operations: List[Operation] = []
    current_version: int = 0
    active_users: Dict[int, str] = {}

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, Set[WebSocket]] = {}
        self.collaboration_states: Dict[int, CollaborationState] = {}
        self.user_sessions: Dict[str, int] = {}

    async def connect(self, websocket: WebSocket, universe_id: int, user_id: int, username: str):
        await websocket.accept()
        if universe_id not in self.active_connections:
            self.active_connections[universe_id] = set()
            self.collaboration_states[universe_id] = CollaborationState()

        self.active_connections[universe_id].add(websocket)
        self.collaboration_states[universe_id].active_users[user_id] = username

        # Send initial state
        await websocket.send_json({
            "type": "initial_state",
            "data": {
                "cursors": [cursor.dict() for cursor in self.collaboration_states[universe_id].cursors.values()],
                "chat_messages": [msg.dict() for msg in self.collaboration_states[universe_id].chat_messages[-50:]],
                "comments": [comment.dict() for comment in self.collaboration_states[universe_id].comments],
                "active_users": self.collaboration_states[universe_id].active_users,
                "current_version": self.collaboration_states[universe_id].current_version
            }
        })

        # Notify others
        await self.broadcast(
            universe_id,
            {
                "type": "user_joined",
                "data": {
                    "user_id": user_id,
                    "username": username,
                    "timestamp": datetime.utcnow().isoformat()
                }
            },
            exclude=websocket
        )

    async def disconnect(self, websocket: WebSocket, universe_id: int, user_id: int):
        self.active_connections[universe_id].remove(websocket)
        if user_id in self.collaboration_states[universe_id].cursors:
            del self.collaboration_states[universe_id].cursors[user_id]
        if user_id in self.collaboration_states[universe_id].active_users:
            del self.collaboration_states[universe_id].active_users[user_id]

        if not self.active_connections[universe_id]:
            del self.active_connections[universe_id]
            del self.collaboration_states[universe_id]
        else:
            await self.broadcast(
                universe_id,
                {
                    "type": "user_left",
                    "data": {
                        "user_id": user_id,
                        "timestamp": datetime.utcnow().isoformat()
                    }
                }
            )

    async def broadcast(
        self,
        universe_id: int,
        message: dict,
        exclude: Optional[WebSocket] = None
    ):
        if universe_id in self.active_connections:
            for connection in self.active_connections[universe_id]:
                if connection != exclude:
                    await connection.send_json(message)

    def transform_operation(self, op1: Operation, op2: Operation) -> Operation:
        """Transform operation1 against operation2."""
        # Implement operational transformation logic here
        # This is a simplified version
        if op1.path == op2.path:
            if op1.timestamp < op2.timestamp:
                return op1
            else:
                # Adjust operation based on the type of change
                if op1.type == "update" and op2.type == "update":
                    # Merge updates
                    op1.value = {**op2.value, **op1.value}
                elif op2.type == "delete":
                    # Operation on deleted path is discarded
                    return None
        return op1

    async def apply_operation(
        self,
        universe_id: int,
        operation: Operation,
        websocket: WebSocket
    ):
        state = self.collaboration_states[universe_id]

        # Transform against all concurrent operations
        for existing_op in state.operations:
            if existing_op.version >= operation.version:
                operation = self.transform_operation(operation, existing_op)
                if operation is None:
                    return

        # Apply the operation
        state.operations.append(operation)
        state.current_version += 1

        # Broadcast the transformed operation
        await self.broadcast(
            universe_id,
            {
                "type": "operation",
                "data": operation.dict()
            },
            exclude=websocket
        )

manager = ConnectionManager()

async def handle_websocket(websocket: WebSocket, universe_id: int, user: User):
    try:
        await manager.connect(websocket, universe_id, user.id, user.username)

        while True:
            message = await websocket.receive_json()

            if message["type"] == "cursor_update":
                cursor = CursorPosition(
                    x=message["data"]["x"],
                    y=message["data"]["y"],
                    timestamp=datetime.utcnow(),
                    user_id=user.id,
                    username=user.username,
                    color=message["data"].get("color", "#1976d2")
                )
                manager.collaboration_states[universe_id].cursors[user.id] = cursor
                await manager.broadcast(
                    universe_id,
                    {
                        "type": "cursor_update",
                        "data": cursor.dict()
                    },
                    exclude=websocket
                )

            elif message["type"] == "chat_message":
                chat_message = ChatMessage(
                    id=len(manager.collaboration_states[universe_id].chat_messages) + 1,
                    user_id=user.id,
                    username=user.username,
                    content=message["data"]["content"],
                    timestamp=datetime.utcnow(),
                    type=message["data"].get("type", "message")
                )
                manager.collaboration_states[universe_id].chat_messages.append(chat_message)
                await manager.broadcast(
                    universe_id,
                    {
                        "type": "chat_message",
                        "data": chat_message.dict()
                    }
                )

            elif message["type"] == "add_comment":
                comment = Comment(
                    id=len(manager.collaboration_states[universe_id].comments) + 1,
                    user_id=user.id,
                    username=user.username,
                    content=message["data"]["content"],
                    timestamp=datetime.utcnow(),
                    position=message["data"]["position"]
                )
                manager.collaboration_states[universe_id].comments.append(comment)
                await manager.broadcast(
                    universe_id,
                    {
                        "type": "add_comment",
                        "data": comment.dict()
                    }
                )

            elif message["type"] == "resolve_comment":
                comment_id = message["data"]["comment_id"]
                for comment in manager.collaboration_states[universe_id].comments:
                    if comment.id == comment_id:
                        comment.resolved = True
                        await manager.broadcast(
                            universe_id,
                            {
                                "type": "resolve_comment",
                                "data": {
                                    "comment_id": comment_id,
                                    "resolved_by": user.username,
                                    "timestamp": datetime.utcnow().isoformat()
                                }
                            }
                        )
                        break

            elif message["type"] == "operation":
                operation = Operation(
                    type=message["data"]["type"],
                    path=message["data"]["path"],
                    value=message["data"]["value"],
                    timestamp=datetime.utcnow(),
                    user_id=user.id,
                    version=manager.collaboration_states[universe_id].current_version + 1
                )
                await manager.apply_operation(universe_id, operation, websocket)

    except WebSocketDisconnect:
        await manager.disconnect(websocket, universe_id, user.id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await websocket.close()
