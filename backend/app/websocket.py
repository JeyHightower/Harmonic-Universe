from flask_socketio import emit, join_room, leave_room
from flask import request, current_app
import logging
from .extensions import socketio

logger = logging.getLogger(__name__)


class WebSocketService:
    """Service class for handling WebSocket connections."""

    def __init__(self, socketio):
        """Initialize WebSocket service."""
        self.socketio = socketio
        self.user_connections = {}  # user_id -> set of socket IDs
        self.collaboration_rooms = {}  # room_id -> room info

    def register_handlers(self):
        """Register WebSocket event handlers."""

        @socketio.on("connect", namespace="/physics")
        def handle_connect():
            """Handle client connection."""
            emit("connected", {"status": "connected"})
            current_app.logger.info("Client connected")

        @socketio.on("disconnect", namespace="/physics")
        def handle_disconnect():
            """Handle WebSocket disconnection."""
            try:
                emit(
                    "disconnected",
                    {
                        "status": "success",
                        "message": "Disconnected from physics namespace",
                    },
                )
            except Exception as e:
                current_app.logger.error(f"WebSocket disconnection error: {str(e)}")
                emit(
                    "error",
                    {"status": "error", "message": "Error during disconnection"},
                )

        @socketio.on("ping", namespace="/physics")
        def handle_ping():
            """Handle ping messages."""
            try:
                return {"status": "success", "message": "pong"}
            except Exception as e:
                current_app.logger.error(f"WebSocket ping error: {str(e)}")
                return {"status": "error", "message": "Failed to process ping"}

        @socketio.on("message", namespace="/physics")
        def handle_message(data):
            """Handle incoming messages."""
            try:
                # Validate message size
                if len(str(data)) > 1000000:  # 1MB limit
                    emit("error", {"status": "error", "message": "Message too large"})
                    return

                # Validate message format
                if not isinstance(data, dict):
                    emit(
                        "error",
                        {"status": "error", "message": "Invalid message format"},
                    )
                    return

                # Process message
                return {
                    "status": "success",
                    "message": "Message received",
                    "data": data,
                }
            except Exception as e:
                current_app.logger.error(f"WebSocket message error: {str(e)}")
                emit(
                    "error", {"status": "error", "message": "Failed to process message"}
                )
                return

        @socketio.on_error(namespace="/physics")
        def handle_error(e):
            """Handle WebSocket errors."""
            current_app.logger.error(f"WebSocket error: {str(e)}")
            return {"status": "error", "message": "An error occurred"}

        @self.socketio.on("join_room")
        def handle_join_room(data):
            """Handle room join request."""
            try:
                room_id = data.get("room_id")
                if not room_id or room_id not in self.collaboration_rooms:
                    emit("error", {"message": "Room not found"})
                    return

                room = self.collaboration_rooms[room_id]
                if len(room["participants"]) >= room["max_participants"]:
                    emit("error", {"message": "Room is full"})
                    return

                user_id = request.user_id
                sid = request.sid

                join_room(room_id)
                room["participants"].add(user_id)

                emit(
                    "room_joined",
                    {
                        "room_id": room_id,
                        "participant_count": len(room["participants"]),
                    },
                    room=room_id,
                )

                logger.info(f"User {user_id} joined room {room_id}")

            except Exception as e:
                logger.error(f"Room join error: {str(e)}")
                emit("error", {"message": "Failed to join room"})

        @self.socketio.on("leave_room")
        def handle_leave_room(data):
            """Handle room leave request."""
            try:
                room_id = data.get("room_id")
                if not room_id or room_id not in self.collaboration_rooms:
                    emit("error", {"message": "Invalid room ID"})
                    return

                user_id = request.user_id
                sid = request.sid

                leave_room(room_id)
                room = self.collaboration_rooms[room_id]
                room["participants"].discard(user_id)

                emit(
                    "room_left",
                    {
                        "room_id": room_id,
                        "participant_count": len(room["participants"]),
                    },
                    room=room_id,
                )

                logger.info(f"User {user_id} left room {room_id}")

                # Clean up empty rooms
                if not room["participants"]:
                    del self.collaboration_rooms[room_id]

            except Exception as e:
                logger.error(f"Room leave error: {str(e)}")
                emit("error", {"message": "Failed to leave room"})

    def create_collaboration_room(
        self, universe_id, owner_id, max_participants=5, mode="view"
    ):
        """Create a new collaboration room."""
        room_id = f"universe_{universe_id}_{mode}"
        self.collaboration_rooms[room_id] = {
            "universe_id": universe_id,
            "owner_id": owner_id,
            "max_participants": max_participants,
            "mode": mode,
            "participants": set(),
            "created_at": request.time,
        }
        return room_id

    def broadcast_to_user(self, user_id, event, data):
        """Broadcast event to all connections of a user."""
        if user_id in self.user_connections:
            for sid in self.user_connections[user_id]:
                self.socketio.emit(event, data, room=sid)

    def broadcast_to_room(self, room_id, event, data, skip_sid=None):
        """Broadcast event to all participants in a room."""
        if room_id in self.collaboration_rooms:
            self.socketio.emit(event, data, room=room_id, skip_sid=skip_sid)

    def cleanup_inactive_rooms(self, max_age_hours=24):
        """Clean up inactive collaboration rooms."""
        current_time = request.time
        inactive_rooms = [
            room_id
            for room_id, room in self.collaboration_rooms.items()
            if (current_time - room["created_at"]).total_seconds()
            > max_age_hours * 3600
        ]
        for room_id in inactive_rooms:
            del self.collaboration_rooms[room_id]
