from flask_socketio import SocketIO, emit, join_room, leave_room, disconnect, Namespace
from flask import request, current_app
from functools import wraps
from . import db, socketio
from .models.user import User
from .models.universe import Universe
from datetime import datetime
from flask_jwt_extended import decode_token
import json
from urllib.parse import parse_qs, parse_qsl
from .auth import verify_token
import traceback
import threading
import time
import logging

logger = logging.getLogger(__name__)

def get_token_from_request():
    """Extract token from request query string or headers."""
    try:
        token = request.args.get('token')
        if not token and request.headers:
            auth_header = request.headers.get('Authorization')
            if auth_header and auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
        return token
    except Exception as e:
        logger.error(f"Error extracting token: {str(e)}")
        return None

def verify_user(token):
    """Verify a user's token and return their ID."""
    try:
        user_id = verify_token(token)
        if not user_id:
            return None

        user = User.query.get(user_id)
        if not user:
            return None

        return user_id
    except Exception as e:
        logger.error(f"Error verifying user: {e}")
        traceback.print_exc()
        return None

def authenticated_only(f):
    """Decorator to ensure WebSocket connections are authenticated"""
    @wraps(f)
    def wrapped(*args, **kwargs):
        logger.debug("Checking authentication")
        namespace = getattr(f, '__namespace__', request.namespace or '/')
        logger.debug(f"Current namespace: {namespace}")

        token = get_token_from_request()
        if not token:
            logger.warning("No token provided")
            emit('error', {
                'code': 'NO_TOKEN',
                'message': 'No token provided',
                'timestamp': datetime.utcnow().isoformat()
            })
            return False

        try:
            decoded = decode_token(token)
            user_id = decoded['sub']
            user = User.query.get(user_id)

            if not user:
                logger.warning(f"User {user_id} not found")
                emit('error', {
                    'code': 'USER_NOT_FOUND',
                    'message': 'User not found',
                    'timestamp': datetime.utcnow().isoformat()
                })
                return False

            logger.debug(f"Authentication successful for user {user.id}")
            request.user_id = user.id
            result = f(*args, **kwargs)
            logger.debug(f"Function result: {result}")
            return result

        except Exception as e:
            logger.error(f"Authentication error: {str(e)}")
            traceback.print_exc()
            emit('error', {
                'code': 'AUTH_ERROR',
                'message': 'Authentication failed',
                'details': str(e),
                'timestamp': datetime.utcnow().isoformat()
            })
            return False

    return wrapped

class TestNamespace(Namespace):
    """Test namespace for WebSocket connections."""

    def __init__(self, namespace=None):
        super().__init__(namespace)
        self.connected_clients = {}
        self.lock = threading.Lock()
        self.cleanup_thread = threading.Thread(target=self._cleanup_stale_connections, daemon=True)
        self.cleanup_thread.start()
        logger.info(f"TestNamespace initialized with namespace: {namespace}")

    def _cleanup_stale_connections(self):
        """Periodically clean up stale connections"""
        while True:
            try:
                with self.lock:
                    current_time = datetime.utcnow()
                    stale_sids = []
                    for sid, client in self.connected_clients.items():
                        last_seen = datetime.fromisoformat(client.get('last_seen', '2000-01-01T00:00:00'))
                        if (current_time - last_seen).total_seconds() > 60:  # 60 seconds timeout
                            stale_sids.append(sid)

                    for sid in stale_sids:
                        logger.warning(f"Removing stale connection {sid}")
                        del self.connected_clients[sid]

            except Exception as e:
                logger.error(f"Error in cleanup thread: {str(e)}")
                traceback.print_exc()

            time.sleep(30)  # Run cleanup every 30 seconds

    def on_connect(self, auth):
        """Handle client connection"""
        try:
            sid = request.environ.get('socketio.sid')
            eio_sid = request.environ.get('engineio.sid')
            logger.info(f"New connection request from {sid} (eio_sid: {eio_sid}) in namespace {self.namespace}")

            # Get token from auth data or query string
            token = None
            if auth and 'token' in auth:
                token = auth['token']
            else:
                token = get_token_from_request()

            if not token:
                logger.warning("No token provided")
                emit('error', {
                    'code': 'NO_TOKEN',
                    'message': 'No token provided'
                })
                return False

            try:
                # Verify token and get user
                user_id = verify_user(token)
                if not user_id:
                    logger.warning("Invalid token")
                    emit('error', {
                        'code': 'INVALID_TOKEN',
                        'message': 'Invalid token'
                    })
                    return False

                logger.info(f"User {user_id} authenticated successfully")

                # Store client info
                with self.lock:
                    self.connected_clients[sid] = {
                        'user_id': user_id,
                        'connected_at': datetime.utcnow().isoformat(),
                        'last_seen': datetime.utcnow().isoformat(),
                        'rooms': set(),
                        'eio_sid': eio_sid
                    }

                # Join user's room and client's room
                join_room(f"user_{user_id}")
                join_room(sid)
                if eio_sid:
                    join_room(eio_sid)

                # Emit connection events
                emit('connected', {
                    'status': 'success',
                    'user_id': user_id,
                    'sid': sid,
                    'eio_sid': eio_sid,
                    'timestamp': datetime.utcnow().isoformat()
                }, room=sid)

                return True

            except Exception as e:
                logger.error(f"Error authenticating client: {str(e)}")
                traceback.print_exc()
                emit('error', {
                    'code': 'AUTH_ERROR',
                    'message': str(e)
                })
                return False

        except Exception as e:
            logger.error(f"Error in connection handler: {str(e)}")
            traceback.print_exc()
            emit('error', {
                'code': 'CONNECTION_ERROR',
                'message': str(e)
            })
            return False

    def on_disconnect(self):
        """Handle client disconnection"""
        try:
            sid = request.environ.get('socketio.sid')
            if sid in self.connected_clients:
                user_id = self.connected_clients[sid]['user_id']
                eio_sid = self.connected_clients[sid].get('eio_sid')
                with self.lock:
                    del self.connected_clients[sid]
                logger.info(f"Client {sid} (eio_sid: {eio_sid}) disconnected (user: {user_id})")
            else:
                logger.warning(f"Unknown client {sid} disconnected")
        except Exception as e:
            logger.error(f"Error in disconnect handler: {str(e)}")
            traceback.print_exc()

    def on_heartbeat(self):
        """Handle heartbeat from client."""
        try:
            sid = request.sid
            if sid in self.connected_clients:
                with self.lock:
                    self.connected_clients[sid]['last_seen'] = datetime.utcnow().isoformat()
                client_data = self.connected_clients[sid]
                user_room = f"user_{client_data['user_id']}"
                emit('heartbeat', {
                    'timestamp': datetime.utcnow().isoformat(),
                    'sid': sid
                }, room=user_room)
            else:
                logger.warning(f"Heartbeat from unknown client {sid}")
        except Exception as e:
            logger.error(f"Error during heartbeat: {str(e)}")
            traceback.print_exc()

    def on_connect_test(self):
        """Handle test connection request from client"""
        try:
            sid = request.sid
            if not sid in self.connected_clients or not self._verify_connection(sid):
                emit('error', {
                    'error': 'Client not connected',
                    'timestamp': datetime.utcnow().isoformat()
                })
                return

            user_id = self.connected_clients[sid]['user_id']
            join_room(sid)  # Ensure client is in their own room
            emit('connect_success', {
                'user_id': user_id,
                'timestamp': datetime.utcnow().isoformat()
            })

        except Exception as e:
            print(f"Error in on_connect_test: {e}")
            emit('error', {
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat()
            })

    def on_join(self, data):
        """Handle client joining a universe room"""
        try:
            sid = request.environ.get('socketio.sid')
            if sid not in self.connected_clients:
                emit('error', {'error': 'Not connected'}, room=sid)
                return False

            universe_id = data.get('universe_id')
            if not universe_id:
                emit('error', {'error': 'No universe ID provided'}, room=sid)
                return False

            room = f"universe_{universe_id}"
            join_room(room)

            with self.lock:
                self.connected_clients[sid]['rooms'].add(room)

            user_id = self.connected_clients[sid]['user_id']
            print(f"Client {sid} (user: {user_id}) joined room {room}")

            # Emit join confirmation to the client
            emit('joined', {
                'status': 'success',
                'universe_id': universe_id,
                'room': room,
                'timestamp': datetime.utcnow().isoformat()
            }, room=sid)

            # Broadcast join event to other clients in the room
            emit('user_joined', {
                'user_id': user_id,
                'universe_id': universe_id,
                'timestamp': datetime.utcnow().isoformat()
            }, room=room, skip_sid=sid)

            return True

        except Exception as e:
            print(f"Error in join handler: {str(e)}")
            traceback.print_exc()
            emit('error', {'error': str(e)}, room=sid)
            return False

    def on_leave(self, data):
        """Handle client leaving a universe room"""
        try:
            sid = request.environ.get('socketio.sid')
            if sid not in self.connected_clients:
                emit('error', {'error': 'Not connected'}, room=sid)
                return False

            universe_id = data.get('universe_id')
            if not universe_id:
                emit('error', {'error': 'No universe ID provided'}, room=sid)
                return False

            room = f"universe_{universe_id}"
            leave_room(room)

            with self.lock:
                self.connected_clients[sid]['rooms'].discard(room)

            user_id = self.connected_clients[sid]['user_id']
            print(f"Client {sid} (user: {user_id}) left room {room}")

            # Emit leave confirmation to the client
            emit('left', {
                'status': 'success',
                'universe_id': universe_id,
                'room': room,
                'timestamp': datetime.utcnow().isoformat()
            }, room=sid)

            # Broadcast leave event to other clients in the room
            emit('user_left', {
                'user_id': user_id,
                'universe_id': universe_id,
                'timestamp': datetime.utcnow().isoformat()
            }, room=room, skip_sid=sid)

            return True

        except Exception as e:
            print(f"Error in leave handler: {str(e)}")
            traceback.print_exc()
            emit('error', {'error': str(e)}, room=sid)
            return False

    def on_parameter_update(self, data):
        """Handle universe parameter updates"""
        try:
            sid = request.environ.get('socketio.sid')
            if sid not in self.connected_clients:
                emit('error', {'error': 'Not connected'}, room=sid)
                return False

            universe_id = data.get('universe_id')
            if not universe_id:
                emit('error', {'error': 'No universe ID provided'}, room=sid)
                return False

            parameters = data.get('parameters')
            if not parameters:
                emit('error', {'error': 'No parameters provided'}, room=sid)
                return False

            room = f"universe_{universe_id}"
            user_id = self.connected_clients[sid]['user_id']

            # Broadcast parameter update to all clients in the room
            emit('parameter_update', {
                'user_id': user_id,
                'universe_id': universe_id,
                'parameters': parameters,
                'timestamp': datetime.utcnow().isoformat()
            }, room=room)

            return True

        except Exception as e:
            print(f"Error in parameter update handler: {str(e)}")
            traceback.print_exc()
            emit('error', {'error': str(e)}, room=sid)
            return False

    @authenticated_only
    def on_start_simulation(self, data):
        """Handle simulation start request"""
        try:
            sid = request.environ.get('socketio.sid')
            if sid not in self.connected_clients:
                emit('error', {'error': 'Not connected'}, room=sid)
                return False

            universe_id = data.get('universe_id')
            if not universe_id:
                emit('error', {'error': 'No universe ID provided'}, room=sid)
                return False

            room = f"universe_{universe_id}"
            user_id = self.connected_clients[sid]['user_id']

            # Broadcast simulation start to all clients in the room
            emit('simulation_started', {
                'user_id': user_id,
                'universe_id': universe_id,
                'timestamp': datetime.utcnow().isoformat()
            }, room=room)

            return True

        except Exception as e:
            print(f"Error in start simulation handler: {str(e)}")
            traceback.print_exc()
            emit('error', {'error': str(e)}, room=sid)
            return False

    @authenticated_only
    def on_stop_simulation(self, data):
        """Handle simulation stop request"""
        try:
            sid = request.environ.get('socketio.sid')
            if sid not in self.connected_clients:
                emit('error', {'error': 'Not connected'}, room=sid)
                return False

            universe_id = data.get('universe_id')
            if not universe_id:
                emit('error', {'error': 'No universe ID provided'}, room=sid)
                return False

            room = f"universe_{universe_id}"
            user_id = self.connected_clients[sid]['user_id']

            # Broadcast simulation stop to all clients in the room
            emit('simulation_stopped', {
                'user_id': user_id,
                'universe_id': universe_id,
                'timestamp': datetime.utcnow().isoformat()
            }, room=room)

            return True

        except Exception as e:
            print(f"Error in stop simulation handler: {str(e)}")
            traceback.print_exc()
            emit('error', {'error': str(e)}, room=sid)
            return False

    @authenticated_only
    def on_cursor_move(self, data):
        """Handle cursor movement updates"""
        try:
            sid = request.environ.get('socketio.sid')
            if sid not in self.connected_clients:
                emit('error', {'error': 'Not connected'}, room=sid)
                return False

            universe_id = data.get('universe_id')
            if not universe_id:
                emit('error', {'error': 'No universe ID provided'}, room=sid)
                return False

            position = data.get('position')
            if not position:
                emit('error', {'error': 'No position provided'}, room=sid)
                return False

            room = f"universe_{universe_id}"
            user_id = self.connected_clients[sid]['user_id']

            # Broadcast cursor position to other clients in the room
            emit('cursor_moved', {
                'user_id': user_id,
                'universe_id': universe_id,
                'position': position,
                'timestamp': datetime.utcnow().isoformat()
            }, room=room, skip_sid=sid)

            return True

        except Exception as e:
            print(f"Error in cursor move handler: {str(e)}")
            traceback.print_exc()
            emit('error', {'error': str(e)}, room=sid)
            return False

    @authenticated_only
    def on_chat_message(self, data):
        """Handle chat messages"""
        try:
            sid = request.environ.get('socketio.sid')
            if sid not in self.connected_clients:
                emit('error', {'error': 'Not connected'}, room=sid)
                return False

            universe_id = data.get('universe_id')
            if not universe_id:
                emit('error', {'error': 'No universe ID provided'}, room=sid)
                return False

            message = data.get('message')
            if not message:
                emit('error', {'error': 'No message provided'}, room=sid)
                return False

            room = f"universe_{universe_id}"
            user_id = self.connected_clients[sid]['user_id']

            # Broadcast chat message to all clients in the room
            emit('chat_message', {
                'user_id': user_id,
                'universe_id': universe_id,
                'message': message,
                'timestamp': datetime.utcnow().isoformat()
            }, room=room)

            return True

        except Exception as e:
            print(f"Error in chat message handler: {str(e)}")
            traceback.print_exc()
            emit('error', {'error': str(e)}, room=sid)
            return False

# Create test namespace instance
test_namespace = TestNamespace('/test')
socketio.on_namespace(test_namespace)

@socketio.on_error_default
def default_error_handler(e):
    """Default error handler for all namespaces and events"""
    sid = request.environ.get('socketio.sid')
    print(f"Error in SocketIO handler for client {sid}: {str(e)}")
    traceback.print_exc()
    emit('error', {'error': str(e)}, room=sid)

