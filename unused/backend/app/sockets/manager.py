from flask_socketio import SocketIO
from typing import Dict, Set
from datetime import datetime

class WebSocketManager:
    """Manages WebSocket connections and events."""

    def __init__(self, socketio: SocketIO):
        self.socketio = socketio
        self.active_users: Dict[int, Set[str]] = {}  # user_id -> set of socket_ids
        self.universe_rooms: Dict[int, Set[int]] = {}  # universe_id -> set of user_ids

    def user_connected(self, user_id: int, socket_id: str) -> None:
        """Track a new user connection."""
        if user_id not in self.active_users:
            self.active_users[user_id] = set()
        self.active_users[user_id].add(socket_id)

    def user_disconnected(self, user_id: int, socket_id: str) -> None:
        """Remove a user connection."""
        if user_id in self.active_users:
            self.active_users[user_id].discard(socket_id)
            if not self.active_users[user_id]:
                del self.active_users[user_id]

    def join_universe(self, universe_id: int, user_id: int) -> None:
        """Add a user to a universe room."""
        if universe_id not in self.universe_rooms:
            self.universe_rooms[universe_id] = set()
        self.universe_rooms[universe_id].add(user_id)

    def leave_universe(self, universe_id: int, user_id: int) -> None:
        """Remove a user from a universe room."""
        if universe_id in self.universe_rooms:
            self.universe_rooms[universe_id].discard(user_id)
            if not self.universe_rooms[universe_id]:
                del self.universe_rooms[universe_id]

    def get_universe_users(self, universe_id: int) -> Set[int]:
        """Get all users in a universe room."""
        return self.universe_rooms.get(universe_id, set())

    def is_user_online(self, user_id: int) -> bool:
        """Check if a user is currently online."""
        return user_id in self.active_users

    def get_active_users_count(self) -> int:
        """Get the total number of active users."""
        return len(self.active_users)

    def broadcast_parameter_update(self, universe_id: int, param_type: str, params: dict) -> None:
        """Broadcast parameter updates to all clients in a universe room."""
        room = f'universe_{universe_id}'
        self.socketio.emit('parameters_updated', {
            'type': param_type,
            'parameters': params,
            'timestamp': datetime.utcnow().isoformat()
        }, room=room)

    def broadcast_simulation_status(self, universe_id: int, status: str, user_info: dict) -> None:
        """Broadcast simulation status changes to all clients in a universe room."""
        room = f'universe_{universe_id}'
        self.socketio.emit(f'simulation_{status}', {
            'status': status,
            'triggered_by': user_info,
            'timestamp': datetime.utcnow().isoformat()
        }, room=room)

    def broadcast_user_presence(self, universe_id: int, user_info: dict, action: str) -> None:
        """Broadcast user presence updates to all clients in a universe room."""
        room = f'universe_{universe_id}'
        self.socketio.emit(f'user_{action}', {
            'user': user_info,
            'timestamp': datetime.utcnow().isoformat()
        }, room=room)

    def broadcast_error(self, universe_id: int, error: str) -> None:
        """Broadcast error messages to all clients in a universe room."""
        room = f'universe_{universe_id}'
        self.socketio.emit('error', {
            'message': error,
            'timestamp': datetime.utcnow().isoformat()
        }, room=room)

    def broadcast_music_update(self, universe_id: int, music_data: dict) -> None:
        """Broadcast music updates to all clients in a universe room."""
        room = f'universe_{universe_id}'
        self.socketio.emit('music_updated', {
            'data': music_data,
            'timestamp': datetime.utcnow().isoformat()
        }, room=room)

    def broadcast_visualization_update(self, universe_id: int, visual_data: dict) -> None:
        """Broadcast visualization updates to all clients in a universe room."""
        room = f'universe_{universe_id}'
        self.socketio.emit('visualization_updated', {
            'data': visual_data,
            'timestamp': datetime.utcnow().isoformat()
        }, room=room)
