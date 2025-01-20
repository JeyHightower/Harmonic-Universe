from flask import request
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_jwt_extended import decode_token
from typing import Dict, Optional, Any, Set
import threading
import time
import logging
import uuid
from datetime import datetime, timedelta
from ..services.harmony_engine import HarmonyEngine
from ..services.storyboard_manager import StoryboardManager
from ..services.audio_generator import AudioGenerator
from ..models import Universe, PhysicsParameters, MusicParameters, VisualizationParameters
from ..extensions import db

logger = logging.getLogger(__name__)

class CollaborationRoom:
    def __init__(self, universe_id: int, owner_id: int, max_participants: int = 5, mode: str = 'view'):
        self.id = str(uuid.uuid4())
        self.universe_id = universe_id
        self.owner_id = owner_id
        self.max_participants = max_participants
        self.mode = mode
        self.participants: Set[str] = set()  # Set of session IDs
        self.created_at = datetime.utcnow()
        self.last_activity = datetime.utcnow()
        self.harmony_engine = HarmonyEngine()
        self.storyboard_manager = StoryboardManager(self.harmony_engine)
        self.audio_generator = AudioGenerator()

    def add_participant(self, session_id: str) -> bool:
        """Add participant to room if space available."""
        if len(self.participants) < self.max_participants:
            self.participants.add(session_id)
            self.last_activity = datetime.utcnow()
            return True
        return False

    def remove_participant(self, session_id: str):
        """Remove participant from room."""
        self.participants.discard(session_id)
        self.last_activity = datetime.utcnow()

    def to_dict(self) -> Dict[str, Any]:
        """Convert room to dictionary."""
        return {
            'id': self.id,
            'universe_id': self.universe_id,
            'owner_id': self.owner_id,
            'max_participants': self.max_participants,
            'mode': self.mode,
            'participant_count': len(self.participants),
            'created_at': self.created_at.isoformat(),
            'last_activity': self.last_activity.isoformat()
        }

class WebSocketService:
    def __init__(self, socketio: SocketIO):
        self.socketio = socketio
        self.collaboration_rooms: Dict[str, CollaborationRoom] = {}
        self.user_connections: Dict[int, Set[str]] = {}  # user_id -> set of sid
        self.session_to_room: Dict[str, str] = {}  # session_id -> room_id
        self.update_thread: Optional[threading.Thread] = None
        self.is_running = False
        self.lock = threading.Lock()

    def create_collaboration_room(self, universe_id: int, owner_id: int,
                              max_participants: int = 5, mode: str = 'view') -> str:
        """Create a new collaboration room."""
        room = CollaborationRoom(universe_id, owner_id, max_participants, mode)
        self.collaboration_rooms[room.id] = room
        return room.id

    def cleanup_inactive_rooms(self, max_age: timedelta = timedelta(hours=1)):
        """Remove inactive collaboration rooms."""
        now = datetime.utcnow()
        inactive_rooms = [
            room_id for room_id, room in self.collaboration_rooms.items()
            if now - room.last_activity > max_age
        ]
        for room_id in inactive_rooms:
            room = self.collaboration_rooms.pop(room_id)
            for session_id in room.participants:
                self.session_to_room.pop(session_id, None)

    def register_handlers(self):
        """Register Socket.IO event handlers."""
        @self.socketio.on('connect')
        def handle_connect():
            """Handle client connection."""
            try:
                # Get token from request args
                token = decode_token(request.args.get('token'))
                user_id = token['sub']

                # Track user connection
                if user_id not in self.user_connections:
                    self.user_connections[user_id] = set()

                # Check connection limit
                if len(self.user_connections[user_id]) >= 5:
                    raise Exception('Maximum connection limit reached')

                self.user_connections[user_id].add(request.sid)
                emit('connect_success', {'user_id': user_id})

            except Exception as e:
                emit('connect_error', {'error': str(e)})
                return False

        @self.socketio.on('disconnect')
        def handle_disconnect():
            """Handle client disconnection."""
            sid = request.sid

            # Remove from user connections
            for user_id, sids in self.user_connections.items():
                if sid in sids:
                    sids.remove(sid)
                    if not sids:
                        del self.user_connections[user_id]
                    break

            # Remove from collaboration room
            if sid in self.session_to_room:
                room_id = self.session_to_room[sid]
                if room_id in self.collaboration_rooms:
                    room = self.collaboration_rooms[room_id]
                    room.remove_participant(sid)
                    if not room.participants:
                        del self.collaboration_rooms[room_id]
                del self.session_to_room[sid]

        @self.socketio.on('join_room')
        def handle_join_room(data):
            """Handle room join request."""
            try:
                room_id = data['room_id']
                if room_id not in self.collaboration_rooms:
                    room_id = self.create_collaboration_room(
                        data.get('universe_id'),
                        data.get('owner_id', request.sid),
                        data.get('max_participants', 5),
                        data.get('mode', 'view')
                    )

                room = self.collaboration_rooms[room_id]
                if room.add_participant(request.sid):
                    join_room(room_id)
                    self.session_to_room[request.sid] = room_id
                    emit('room_joined', {'room': room.to_dict()})
                else:
                    emit('error', {'message': 'Room is full'})

            except Exception as e:
                emit('error', {'message': str(e)})

        @self.socketio.on('leave_room')
        def handle_leave_room(data):
            """Handle room leave request."""
            try:
                room_id = data['room_id']
                if room_id in self.collaboration_rooms:
                    room = self.collaboration_rooms[room_id]
                    room.remove_participant(request.sid)
                    leave_room(room_id)
                    if request.sid in self.session_to_room:
                        del self.session_to_room[request.sid]
                    if not room.participants:
                        del self.collaboration_rooms[room_id]
                    emit('room_left', {'room_id': room_id})
                else:
                    emit('error', {'message': 'Room not found'})

            except Exception as e:
                emit('error', {'message': str(e)})

        @self.socketio.on('parameter_update')
        def handle_parameter_update(data):
            """Handle parameter update request."""
            try:
                if request.sid in self.session_to_room:
                    room_id = self.session_to_room[request.sid]
                    room = self.collaboration_rooms[room_id]
                    room.last_activity = datetime.utcnow()
                    emit('parameter_update', data, room=room_id)
                else:
                    emit('error', {'message': 'Not in a room'})

            except Exception as e:
                emit('error', {'message': str(e)})

        @self.socketio.on('music_generation')
        def handle_music_generation(data):
            """Handle music generation request."""
            try:
                if request.sid in self.session_to_room:
                    room_id = self.session_to_room[request.sid]
                    room = self.collaboration_rooms[room_id]
                    room.last_activity = datetime.utcnow()

                    # Generate music using the room's audio generator
                    music_data = room.audio_generator.generate(
                        duration=data.get('duration', 30),
                        start_time=data.get('start_time', 0)
                    )

                    emit('music_update', music_data, room=room_id)
                else:
                    emit('error', {'message': 'Not in a room'})

            except Exception as e:
                emit('error', {'message': str(e)})

        @self.socketio.on('visualization_update')
        def handle_visualization_update(data):
            """Handle visualization update request."""
            try:
                if request.sid in self.session_to_room:
                    room_id = self.session_to_room[request.sid]
                    room = self.collaboration_rooms[room_id]
                    room.last_activity = datetime.utcnow()

                    # Update visualization parameters
                    emit('visualization_update', data, room=room_id)
                else:
                    emit('error', {'message': 'Not in a room'})

            except Exception as e:
                emit('error', {'message': str(e)})

        @self.socketio.on('audio_analysis')
        def handle_audio_analysis(data):
            """Handle audio analysis data."""
            try:
                if request.sid in self.session_to_room:
                    room_id = self.session_to_room[request.sid]
                    room = self.collaboration_rooms[room_id]
                    room.last_activity = datetime.utcnow()

                    # Process audio analysis data
                    emit('audio_analysis', data, room=room_id)
                else:
                    emit('error', {'message': 'Not in a room'})

            except Exception as e:
                emit('error', {'message': str(e)})

    def start(self):
        """Start the WebSocket service."""
        if not self.is_running:
            self.is_running = True
            self.update_thread = threading.Thread(target=self._run_cleanup)
            self.update_thread.daemon = True
            self.update_thread.start()
            self.register_handlers()

    def stop(self):
        """Stop the WebSocket service."""
        self.is_running = False
        if self.update_thread:
            self.update_thread.join()

    def _run_cleanup(self):
        """Run periodic cleanup of inactive rooms."""
        while self.is_running:
            self.cleanup_inactive_rooms()
            time.sleep(300)  # Run cleanup every 5 minutes
