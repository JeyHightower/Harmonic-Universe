from flask import request
from flask_socketio import SocketIO, emit, join_room, leave_room
from typing import Dict, Optional
import threading
import time
import logging
from .harmony_engine import HarmonyEngine
from .storyboard_manager import StoryboardManager
from .audio_generator import AudioGenerator

logger = logging.getLogger(__name__)

class WebSocketManager:
    def __init__(self, socketio: SocketIO):
        self.socketio = socketio
        self.rooms: Dict[str, Dict] = {}
        self.update_thread: Optional[threading.Thread] = None
        self.is_running = False
        self.lock = threading.Lock()

    def initialize_room(self, room_id: str):
        """Initialize a new room with required components."""
        with self.lock:
            if room_id not in self.rooms:
                harmony_engine = HarmonyEngine()
                storyboard_manager = StoryboardManager(harmony_engine)
                audio_generator = AudioGenerator()

                self.rooms[room_id] = {
                    'harmony_engine': harmony_engine,
                    'storyboard_manager': storyboard_manager,
                    'audio_generator': audio_generator,
                    'clients': set(),
                    'last_update': time.time()
                }

                # Start the harmony engine
                harmony_engine.start()
                logger.info(f"Room {room_id} initialized")

    def cleanup_room(self, room_id: str):
        """Clean up resources for a room."""
        with self.lock:
            if room_id in self.rooms:
                # Stop the harmony engine
                self.rooms[room_id]['harmony_engine'].stop()
                # Stop any playing audio
                self.rooms[room_id]['audio_generator'].stop_playback()

                # Remove room data
                del self.rooms[room_id]
                logger.info(f"Room {room_id} cleaned up")

    def handle_client_message(self, message_type: str, data: Dict, room_id: str):
        """Handle different types of client messages."""
        with self.lock:
            if room_id not in self.rooms:
                raise ValueError("Invalid room")

            room_data = self.rooms[room_id]
            harmony_engine = room_data['harmony_engine']
            storyboard_manager = room_data['storyboard_manager']
            audio_generator = room_data['audio_generator']

            if message_type == 'generate_audio':
                # Generate audio based on current physics parameters
                physics_params = harmony_engine.get_physics_parameters()
                audio_buffer = audio_generator.generate_harmony(physics_params)

                # Save to file if requested
                if data.get('save_to_file'):
                    filename = f"harmony_{int(time.time())}.wav"
                    filepath = f"static/audio/{filename}"
                    if audio_generator.save_to_file(filepath):
                        emit('audio_generated', {
                            'status': 'success',
                            'filepath': filepath
                        }, room=room_id)
                    else:
                        emit('error', {
                            'message': 'Failed to save audio file'
                        }, room=room_id)

                # Play audio if requested
                if data.get('play'):
                    audio_generator.play_buffer()
                    emit('audio_playing', {
                        'status': 'success'
                    }, room=room_id)

            elif message_type == 'stop_audio':
                audio_generator.stop_playback()
                emit('audio_stopped', {
                    'status': 'success'
                }, room=room_id)

            elif message_type == 'add_particle':
                harmony_engine.add_particle(
                    x=data.get('x', 0),
                    y=data.get('y', 0),
                    mass=data.get('mass', 1.0)
                )
            elif message_type == 'clear_particles':
                harmony_engine.clear_particles()
            elif message_type == 'update_physics':
                harmony_engine.update_physics_parameters(data)
            elif message_type == 'timeline_control':
                if data.get('action') == 'play':
                    storyboard_manager.play(data.get('start_time', 0.0))
                elif data.get('action') == 'pause':
                    storyboard_manager.pause()
                elif data.get('action') == 'seek':
                    storyboard_manager.seek(data.get('timestamp', 0.0))
            else:
                raise ValueError(f"Unknown message type: {message_type}")

    def register_handlers(self):
        """Register Socket.IO event handlers."""
        @self.socketio.on('connect', namespace='/')
        def handle_connect():
            logger.info(f"Client connected: {request.sid}")
            emit('connection_established', {'status': 'connected'})

        @self.socketio.on('disconnect', namespace='/')
        def handle_disconnect():
            logger.info(f"Client disconnected: {request.sid}")

        @self.socketio.on('join_room', namespace='/')
        def handle_join_room(data):
            try:
                room_id = data['room_id']
                join_room(room_id)

                # Initialize room if it doesn't exist
                self.initialize_room(room_id)

                # Add client to room
                with self.lock:
                    self.rooms[room_id]['clients'].add(request.sid)

                emit('room_joined', {'status': 'success', 'room_id': room_id})
                logger.info(f"Client {request.sid} joined room {room_id}")
            except Exception as e:
                logger.error(f"Error joining room: {str(e)}")
                emit('error', {'message': 'Failed to join room'})

        @self.socketio.on('leave_room', namespace='/')
        def handle_leave_room(data):
            try:
                room_id = data['room_id']
                leave_room(room_id)

                # Remove client from room
                with self.lock:
                    if room_id in self.rooms:
                        self.rooms[room_id]['clients'].remove(request.sid)

                        # Cleanup room if empty
                        if not self.rooms[room_id]['clients']:
                            self.cleanup_room(room_id)

                emit('room_left', {'status': 'success', 'room_id': room_id})
                logger.info(f"Client {request.sid} left room {room_id}")
            except Exception as e:
                logger.error(f"Error leaving room: {str(e)}")
                emit('error', {'message': 'Failed to leave room'})

        @self.socketio.on('client_message', namespace='/')
        def handle_message(data):
            try:
                message_type = data.get('type')
                room_id = data.get('room_id')
                payload = data.get('payload', {})

                if not all([message_type, room_id]):
                    raise ValueError("Missing required message fields")

                self.handle_client_message(message_type, payload, room_id)
                emit('message_processed', {
                    'status': 'success',
                    'type': message_type,
                    'room_id': room_id
                })
            except Exception as e:
                logger.error(f"Error handling message: {str(e)}")
                emit('error', {'message': 'Failed to process message'})

    def start_updates(self):
        """Start the update thread for sending state updates."""
        self.is_running = True
        self.update_thread = threading.Thread(target=self._update_loop)
        self.update_thread.daemon = True
        self.update_thread.start()

    def stop_updates(self):
        """Stop the update thread."""
        self.is_running = False
        if self.update_thread:
            self.update_thread.join()

    def _update_loop(self):
        """Main loop for sending state updates to clients."""
        update_interval = 1.0 / 60  # 60 FPS

        while self.is_running:
            current_time = time.time()

            with self.lock:
                # Update each active room
                for room_id, room_data in self.rooms.items():
                    if room_data['clients']:  # Only update rooms with clients
                        harmony_engine = room_data['harmony_engine']
                        storyboard_manager = room_data['storyboard_manager']

                        # Get current state
                        harmony_state = harmony_engine.get_state()
                        timeline_state = {
                            'current_time': storyboard_manager.current_time,
                            'is_playing': storyboard_manager.is_playing,
                            'duration': storyboard_manager.get_duration()
                        }

                        # Emit state update to room
                        self.socketio.emit('state_update', {
                            'harmony': harmony_state,
                            'timeline': timeline_state
                        }, room=room_id)

                        room_data['last_update'] = current_time

            # Sleep for remaining time
            elapsed = time.time() - current_time
            sleep_time = max(0, update_interval - elapsed)
            if sleep_time > 0:
                time.sleep(sleep_time)
