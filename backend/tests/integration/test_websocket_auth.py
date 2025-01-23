import pytest
import jwt
from datetime import datetime, timedelta
from flask_socketio import SocketIOTestClient
from app import create_app
from app.extensions import db
from app.models import User, Universe

@pytest.fixture
def app():
    app = create_app('testing')
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def socketio_client(app):
    socketio = app.websocket_manager.socketio
    return SocketIOTestClient(app, socketio)

@pytest.fixture
def test_user(app):
    user = User(username='testuser', email='test@example.com')
    user.set_password('password123')
    db.session.add(user)
    db.session.commit()
    return user

@pytest.fixture
def auth_token(app, test_user):
    """Create a valid JWT token for testing."""
    token = jwt.encode(
        {
            'sub': test_user.id,
            'exp': datetime.utcnow() + timedelta(days=1)
        },
        app.config['JWT_SECRET_KEY'],
        algorithm='HS256'
    )
    return token

def test_connection_without_token(socketio_client):
    """Test connection attempt without token."""
    socketio_client.connect()
    received = socketio_client.get_received()
    assert any(msg['name'] == 'error' for msg in received)
    assert any('Authentication required' in str(msg['args']) for msg in received)

def test_connection_with_invalid_token(socketio_client):
    """Test connection attempt with invalid token."""
    socketio_client.connect(query_string='token=invalid_token')
    received = socketio_client.get_received()
    assert any(msg['name'] == 'error' for msg in received)
    assert any('Invalid token' in str(msg['args']) for msg in received)

def test_connection_with_expired_token(app, socketio_client, test_user):
    """Test connection attempt with expired token."""
    # Create expired token
    expired_token = jwt.encode(
        {
            'sub': test_user.id,
            'exp': datetime.utcnow() - timedelta(days=1)
        },
        app.config['JWT_SECRET_KEY'],
        algorithm='HS256'
    )

    socketio_client.connect(query_string=f'token={expired_token}')
    received = socketio_client.get_received()
    assert any(msg['name'] == 'error' for msg in received)
    assert any('Token has expired' in str(msg['args']) for msg in received)

def test_successful_connection(socketio_client, auth_token):
    """Test successful connection with valid token."""
    socketio_client.connect(query_string=f'token={auth_token}')
    received = socketio_client.get_received()
    assert any(msg['name'] == 'connect_success' for msg in received)

def test_token_user_match(socketio_client, auth_token, test_user):
    """Test that connected user matches token."""
    socketio_client.connect(query_string=f'token={auth_token}')
    received = socketio_client.get_received()
    success_msg = next(msg for msg in received if msg['name'] == 'connect_success')
    assert success_msg['args'][0]['user_id'] == test_user.id

def test_reconnection_with_same_token(socketio_client, auth_token):
    """Test reconnection with same token."""
    # First connection
    socketio_client.connect(query_string=f'token={auth_token}')
    socketio_client.disconnect()

    # Reconnection
    socketio_client.connect(query_string=f'token={auth_token}')
    received = socketio_client.get_received()
    assert any(msg['name'] == 'connect_success' for msg in received)

def test_multiple_connections_same_user(app, auth_token):
    """Test multiple connections from same user."""
    clients = [SocketIOTestClient(app, app.websocket_manager.socketio) for _ in range(3)]

    # Connect all clients
    for client in clients:
        client.connect(query_string=f'token={auth_token}')
        received = client.get_received()
        assert any(msg['name'] == 'connect_success' for msg in received)

    # Verify connection count in WebSocket manager
    assert len(app.websocket_manager.user_connections[1]) == 3  # Assuming user_id is 1

def test_authentication_required_events(socketio_client, auth_token):
    """Test that authenticated events require valid token."""
    # Connect without authentication
    socketio_client.connect()

    # Try to join room
    socketio_client.emit('join_room', {'room_id': 'test_room'})
    received = socketio_client.get_received()
    assert any(msg['name'] == 'error' for msg in received)
    assert any('Authentication required' in str(msg['args']) for msg in received)

    # Connect with authentication
    socketio_client.disconnect()
    socketio_client.connect(query_string=f'token={auth_token}')

    # Try to join room again
    socketio_client.emit('join_room', {'room_id': 'test_room'})
    received = socketio_client.get_received()
    assert any(msg['name'] == 'room_joined' for msg in received)
