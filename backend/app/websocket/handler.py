"""
WebSocket event handlers using Flask-SocketIO.
"""

from datetime import datetime
from typing import Dict, List, Optional, Set, Any
from dataclasses import dataclass, asdict
from flask_socketio import emit, join_room, leave_room
from flask_jwt_extended import jwt_required, get_jwt_identity
import json
import logging
from ..models.user import User
from ..models.universe.universe import Universe
from ..core.errors import NotFoundError, AuthorizationError, WebSocketError
from backend.app import socketio

logger = logging.getLogger(__name__)

@dataclass
class CursorPosition:
    """Cursor position data."""
    x: float
    y: float
    timestamp: datetime
    user_id: int
    username: str
    color: str

@dataclass
class ChatMessage:
    """Chat message data."""
    id: int
    user_id: int
    username: str
    content: str
    timestamp: datetime
    type: str = "message"  # message, system, error

@dataclass
class Comment:
    """Comment data."""
    id: int
    user_id: int
    username: str
    content: str
    timestamp: datetime
    position: Dict[str, float]
    resolved: bool = False

@dataclass
class Operation:
    """Operation for operational transformation."""
    type: str
    path: str
    value: Any
    timestamp: datetime
    user_id: int
    version: int

@dataclass
class CollaborationState:
    """State for a collaborative session."""
    cursors: Dict[int, CursorPosition] = None
    chat_messages: List[ChatMessage] = None
    comments: List[Comment] = None
    operations: List[Operation] = None
    current_version: int = 0
    active_users: Dict[int, str] = None

    def __post_init__(self):
        if self.cursors is None:
            self.cursors = {}
        if self.chat_messages is None:
            self.chat_messages = []
        if self.comments is None:
            self.comments = []
        if self.operations is None:
            self.operations = []
        if self.active_users is None:
            self.active_users = {}

class CollaborationManager:
    def __init__(self):
        self.collaboration_states: Dict[int, CollaborationState] = {}

    def get_state(self, universe_id: int) -> CollaborationState:
        if universe_id not in self.collaboration_states:
            self.collaboration_states[universe_id] = CollaborationState()
        return self.collaboration_states[universe_id]

    def transform_operation(self, op1: Operation, op2: Operation) -> Optional[Operation]:
        """Transform operation1 against operation2."""
        if op1.path == op2.path:
            if op1.timestamp < op2.timestamp:
                return op1
            else:
                if op1.type == "update" and op2.type == "update":
                    op1.value = {**op2.value, **op1.value}
                elif op2.type == "delete":
                    return None
        return op1

manager = CollaborationManager()

@socketio.on('connect')
@jwt_required()
def handle_connect():
    """Handle client connection."""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user:
        raise WebSocketError("User not found")

    join_room(f"user_{current_user_id}")
    emit('connection_established', {
        'user_id': current_user_id,
        'message': 'Connected successfully'
    })

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection."""
    current_user_id = get_jwt_identity()
    if current_user_id:
        leave_room(f"user_{current_user_id}")

@socketio.on('join_universe')
@jwt_required()
def handle_join_universe(data):
    """Handle joining a universe room."""
    universe_id = data.get('universe_id')
    if not universe_id:
        raise WebSocketError("Universe ID is required")

    current_user_id = get_jwt_identity()
    room = f"universe_{universe_id}"
    join_room(room)
    emit('universe_joined', {
        'universe_id': universe_id,
        'user_id': current_user_id
    }, room=room)

@socketio.on('leave_universe')
@jwt_required()
def handle_leave_universe(data):
    """Handle leaving a universe room."""
    universe_id = data.get('universe_id')
    if not universe_id:
        raise WebSocketError("Universe ID is required")

    current_user_id = get_jwt_identity()
    room = f"universe_{universe_id}"
    leave_room(room)
    emit('universe_left', {
        'universe_id': universe_id,
        'user_id': current_user_id
    }, room=room)

@socketio.on_error()
def error_handler(e):
    """Handle WebSocket errors."""
    emit('error', {
        'message': str(e),
        'type': e.__class__.__name__
    })

def init_socketio(socketio):
    @socketio.on('join')
    def handle_join(data):
        universe_id = data['universe_id']
        user_id = data['user_id']
        username = data['username']

        join_room(f'universe_{universe_id}')
        state = manager.get_state(universe_id)
        state.active_users[user_id] = username

        # Send initial state
        emit('initial_state', {
            'cursors': [asdict(cursor) for cursor in state.cursors.values()],
            'chat_messages': [asdict(msg) for msg in state.chat_messages[-50:]],
            'comments': [asdict(comment) for comment in state.comments],
            'active_users': state.active_users,
            'current_version': state.current_version
        })

        # Notify others
        emit('user_joined', {
            'user_id': user_id,
            'username': username,
            'timestamp': datetime.utcnow().isoformat()
        }, room=f'universe_{universe_id}', include_self=False)

    @socketio.on('leave')
    def handle_leave(data):
        universe_id = data['universe_id']
        user_id = data['user_id']

        state = manager.get_state(universe_id)
        if user_id in state.cursors:
            del state.cursors[user_id]
        if user_id in state.active_users:
            del state.active_users[user_id]

        leave_room(f'universe_{universe_id}')
        emit('user_left', {
            'user_id': user_id,
            'timestamp': datetime.utcnow().isoformat()
        }, room=f'universe_{universe_id}')

    @socketio.on('cursor_update')
    def handle_cursor_update(data):
        universe_id = data['universe_id']
        user_id = data['user_id']
        username = data['username']

        cursor = CursorPosition(
            x=data['x'],
            y=data['y'],
            timestamp=datetime.utcnow(),
            user_id=user_id,
            username=username,
            color=data.get('color', '#1976d2')
        )

        state = manager.get_state(universe_id)
        state.cursors[user_id] = cursor

        emit('cursor_update', asdict(cursor),
             room=f'universe_{universe_id}',
             include_self=False)

    @socketio.on('chat_message')
    def handle_chat_message(data):
        universe_id = data['universe_id']
        user_id = data['user_id']
        username = data['username']

        state = manager.get_state(universe_id)
        message = ChatMessage(
            id=len(state.chat_messages) + 1,
            user_id=user_id,
            username=username,
            content=data['content'],
            timestamp=datetime.utcnow(),
            type=data.get('type', 'message')
        )

        state.chat_messages.append(message)
        emit('chat_message', asdict(message),
             room=f'universe_{universe_id}')

    @socketio.on('add_comment')
    def handle_add_comment(data):
        universe_id = data['universe_id']
        user_id = data['user_id']
        username = data['username']

        state = manager.get_state(universe_id)
        comment = Comment(
            id=len(state.comments) + 1,
            user_id=user_id,
            username=username,
            content=data['content'],
            timestamp=datetime.utcnow(),
            position=data['position'],
            resolved=False
        )

        state.comments.append(comment)
        emit('add_comment', asdict(comment),
             room=f'universe_{universe_id}')

    @socketio.on('resolve_comment')
    def handle_resolve_comment(data):
        universe_id = data['universe_id']
        comment_id = data['comment_id']

        state = manager.get_state(universe_id)
        for comment in state.comments:
            if comment.id == comment_id:
                comment.resolved = True
                emit('resolve_comment', {
                    'comment_id': comment_id
                }, room=f'universe_{universe_id}')
                break

    @socketio.on('operation')
    def handle_operation(data):
        universe_id = data['universe_id']
        operation = Operation(
            type=data['type'],
            path=data['path'],
            value=data['value'],
            timestamp=datetime.utcnow(),
            user_id=data['user_id'],
            version=data['version']
        )

        state = manager.get_state(universe_id)

        # Transform against all concurrent operations
        for existing_op in state.operations:
            if existing_op.version >= operation.version:
                operation = manager.transform_operation(operation, existing_op)
                if operation is None:
                    return

        # Apply the operation
        state.operations.append(operation)
        state.current_version += 1

        # Broadcast the transformed operation
        emit('operation', asdict(operation),
             room=f'universe_{universe_id}',
             include_self=False)
