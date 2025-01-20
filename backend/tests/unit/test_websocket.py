import pytest
from flask import Flask
from flask_socketio import SocketIO
from datetime import datetime, timedelta
from app.websocket import WebSocketService
from app.models import User, Universe, PhysicsParameters, MusicParameters, VisualizationParameters
from app.extensions import db
from unittest.mock import Mock, patch

@pytest.fixture
def app():
    """Create a Flask application."""
    app = Flask(__name__)
    app.config['TESTING'] = True
    app.config['SECRET_KEY'] = 'test-key'
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    return app

@pytest.fixture
def socketio(app):
    """Create a SocketIO instance."""
    return SocketIO(app, async_mode='threading')

@pytest.fixture
def websocket_service(app, socketio):
    """Create a WebSocket service instance."""
    service = WebSocketService(socketio)
    service.start()
    yield service
    service.stop()

@pytest.fixture
def test_user(app):
    """Create a test user."""
    with app.app_context():
        user = User(email='test@example.com', password='testpass123')
        db.session.add(user)
        db.session.commit()
        return user

@pytest.fixture
def test_universe(app, test_user):
    """Create a test universe."""
    with app.app_context():
        universe = Universe(
            name='Test Universe',
            description='Test Description',
            user_id=test_user.id,
            is_public=True
        )
        db.session.add(universe)
        db.session.commit()

        # Add parameters
        physics = PhysicsParameters(
            universe_id=universe.id,
            gravity=9.81,
            friction=0.5,
            elasticity=0.7,
            air_resistance=0.1,
            density=1.0
        )
        music = MusicParameters(
            universe_id=universe.id,
            harmony=0.5,
            tempo=120,
            key='C',
            scale='major'
        )
        visualization = VisualizationParameters(
            universe_id=universe.id,
            brightness=0.8,
            saturation=0.7,
            complexity=0.5,
            color_scheme='rainbow'
        )

        db.session.add_all([physics, music, visualization])
        db.session.commit()
        return universe

def test_create_collaboration_room(websocket_service, test_universe, test_user):
    """Test creation of a collaboration room."""
    room_id = websocket_service.create_collaboration_room(
        universe_id=test_universe.id,
        owner_id=test_user.id,
        max_participants=5,
        mode='view'
    )

    assert room_id in websocket_service.collaboration_rooms
    room = websocket_service.collaboration_rooms[room_id]
    assert room.universe_id == test_universe.id
    assert room.owner_id == test_user.id
    assert room.max_participants == 5
    assert room.mode == 'view'
    assert len(room.participants) == 0

def test_add_participant_to_room(websocket_service, test_universe, test_user):
    """Test adding a participant to a room."""
    room_id = websocket_service.create_collaboration_room(
        test_universe.id,
        test_user.id
    )
    room = websocket_service.collaboration_rooms[room_id]

    session_id = 'test-session'
    assert room.add_participant(session_id)
    assert session_id in room.participants
    assert len(room.participants) == 1

def test_room_participant_limit(websocket_service, test_universe, test_user):
    """Test room participant limit."""
    room_id = websocket_service.create_collaboration_room(
        test_universe.id,
        test_user.id,
        max_participants=2
    )
    room = websocket_service.collaboration_rooms[room_id]

    assert room.add_participant('session1')
    assert room.add_participant('session2')
    assert not room.add_participant('session3')  # Should fail
    assert len(room.participants) == 2

def test_remove_participant_from_room(websocket_service, test_universe, test_user):
    """Test removing a participant from a room."""
    room_id = websocket_service.create_collaboration_room(
        test_universe.id,
        test_user.id
    )
    room = websocket_service.collaboration_rooms[room_id]

    session_id = 'test-session'
    room.add_participant(session_id)
    assert session_id in room.participants

    room.remove_participant(session_id)
    assert session_id not in room.participants

def test_cleanup_inactive_rooms(websocket_service, test_universe, test_user):
    """Test cleanup of inactive rooms."""
    room_id = websocket_service.create_collaboration_room(
        test_universe.id,
        test_user.id
    )
    room = websocket_service.collaboration_rooms[room_id]

    # Set last activity to 2 hours ago
    room.last_activity = datetime.utcnow() - timedelta(hours=2)

    # Run cleanup with 1-hour max age
    websocket_service.cleanup_inactive_rooms(max_age=timedelta(hours=1))

    assert room_id not in websocket_service.collaboration_rooms

@pytest.mark.parametrize('event_name,event_data,expected_response', [
    ('parameter_update', {
        'parameters': {
            'physics': {'gravity': 9.81},
            'music': {'tempo': 120},
            'visualization': {'brightness': 0.8}
        }
    }, 'parameter_update'),
    ('music_generation', {
        'duration': 30,
        'start_time': 0
    }, 'music_update'),
    ('visualization_update', {
        'width': 800,
        'height': 600,
        'quality': 'high'
    }, 'visualization_update'),
])
def test_event_handlers(websocket_service, test_universe, test_user, event_name, event_data, expected_response):
    """Test WebSocket event handlers."""
    # Create a room and add a participant
    room_id = websocket_service.create_collaboration_room(
        test_universe.id,
        test_user.id
    )
    session_id = 'test-session'
    room = websocket_service.collaboration_rooms[room_id]
    room.add_participant(session_id)
    websocket_service.session_to_room[session_id] = room_id

    # Mock request context
    mock_request = Mock()
    mock_request.sid = session_id

    # Mock emit function
    mock_emit = Mock()

    with patch('flask_socketio.emit', mock_emit), \
         patch('flask.request', mock_request):

        # Call the event handler
        handler = next(h for h in websocket_service.socketio.handlers['/'][event_name])
        handler(event_data)

        # Verify emit was called with correct arguments
        mock_emit.assert_called_with(
            expected_response,
            event_data,
            room=room_id
        )

def test_connection_limit(websocket_service):
    """Test connection limit per user."""
    user_id = 1

    # Add maximum number of connections
    for i in range(5):
        websocket_service.user_connections[user_id] = {f'session{i}'}

    # Mock request context
    mock_request = Mock()
    mock_request.sid = 'new-session'
    mock_request.args.get.return_value = 'valid-token'

    # Mock token decoding
    mock_decode = Mock(return_value={'sub': user_id})

    # Mock emit function
    mock_emit = Mock()

    with patch('flask_socketio.emit', mock_emit), \
         patch('flask.request', mock_request), \
         patch('flask_jwt_extended.decode_token', mock_decode):

        # Call the connect handler
        handler = next(h for h in websocket_service.socketio.handlers['/']['connect'])
        result = handler()

        # Verify connection was rejected
        assert result is False
        mock_emit.assert_called_with(
            'connect_error',
            {'error': 'Maximum connection limit reached'}
        )

def test_error_handling(websocket_service):
    """Test error handling in event handlers."""
    # Mock request context
    mock_request = Mock()
    mock_request.sid = 'test-session'

    # Mock emit function
    mock_emit = Mock()

    with patch('flask_socketio.emit', mock_emit), \
         patch('flask.request', mock_request):

        # Call join_room handler without required data
        handler = next(h for h in websocket_service.socketio.handlers['/']['join_room'])
        handler({})  # Empty data should cause an error

        # Verify error was emitted
        mock_emit.assert_called_with(
            'error',
            {'message': expect.stringContaining('room_id')}
        )
