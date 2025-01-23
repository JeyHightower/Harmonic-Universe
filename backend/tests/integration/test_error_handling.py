import pytest
from flask_socketio import SocketIOTestClient
from datetime import datetime, timedelta
from app import create_app
from app.extensions import db
from app.models.base import User, Universe
import json

@pytest.fixture
def app():
    app = create_app('testing')
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def test_user(app):
    user = User(username='testuser', email='test@example.com')
    user.set_password('password123')
    db.session.add(user)
    db.session.commit()
    return user

@pytest.fixture
def test_universe(app, test_user):
    universe = Universe(
        name='Test Universe',
        description='Test Description',
        user_id=test_user.id,
        is_public=True
    )
    db.session.add(universe)
    db.session.commit()
    return universe

@pytest.fixture
def socketio_client(app):
    return SocketIOTestClient(app, app.websocket_manager.socketio)

def test_invalid_parameter_values(socketio_client, test_universe):
    """Test handling of invalid parameter values."""
    # Join room first
    socketio_client.emit('join_room', {
        'universe_id': test_universe.id,
        'mode': 'edit'
    })
    socketio_client.get_received()

    # Test invalid physics parameters
    invalid_params = {
        'physics': {'gravity': -100},  # Invalid negative gravity
        'music': {'tempo': 0},  # Invalid tempo
        'visualization': {'brightness': 2.0}  # Brightness > 1.0
    }
    socketio_client.emit('parameter_update', {'parameters': invalid_params})

    received = socketio_client.get_received()
    error_msg = next(msg for msg in received if msg['name'] == 'error')
    assert 'invalid parameter values' in error_msg['args'][0]['message'].lower()

def test_malformed_messages(socketio_client):
    """Test handling of malformed messages."""
    # Send malformed JSON
    socketio_client.emit('parameter_update', 'not a json object')

    received = socketio_client.get_received()
    error_msg = next(msg for msg in received if msg['name'] == 'error')
    assert 'invalid message format' in error_msg['args'][0]['message'].lower()

def test_missing_required_fields(socketio_client, test_universe):
    """Test handling of messages with missing required fields."""
    # Join room without required universe_id
    socketio_client.emit('join_room', {})

    received = socketio_client.get_received()
    error_msg = next(msg for msg in received if msg['name'] == 'error')
    assert 'missing required field' in error_msg['args'][0]['message'].lower()

def test_unauthorized_actions(socketio_client, test_universe):
    """Test handling of unauthorized actions."""
    # Try to update parameters without joining room
    params = {
        'physics': {'gravity': 9.81}
    }
    socketio_client.emit('parameter_update', {'parameters': params})

    received = socketio_client.get_received()
    error_msg = next(msg for msg in received if msg['name'] == 'error')
    assert 'not in a room' in error_msg['args'][0]['message'].lower()

def test_rate_limiting(socketio_client, test_universe):
    """Test rate limiting of WebSocket messages."""
    # Join room
    socketio_client.emit('join_room', {
        'universe_id': test_universe.id,
        'mode': 'edit'
    })
    socketio_client.get_received()

    # Send many messages rapidly
    for _ in range(100):
        socketio_client.emit('parameter_update', {
            'parameters': {'physics': {'gravity': 9.81}}
        })

    received = socketio_client.get_received()
    error_msg = next(msg for msg in received if msg['name'] == 'error')
    assert 'rate limit exceeded' in error_msg['args'][0]['message'].lower()

def test_invalid_room_id(socketio_client):
    """Test handling of invalid room IDs."""
    socketio_client.emit('join_room', {
        'room_id': 'nonexistent-room'
    })

    received = socketio_client.get_received()
    error_msg = next(msg for msg in received if msg['name'] == 'error')
    assert 'room not found' in error_msg['args'][0]['message'].lower()

def test_duplicate_room_join(socketio_client, test_universe):
    """Test handling of duplicate room join attempts."""
    # Join room first time
    socketio_client.emit('join_room', {
        'universe_id': test_universe.id,
        'mode': 'edit'
    })
    socketio_client.get_received()

    # Try to join same room again
    socketio_client.emit('join_room', {
        'universe_id': test_universe.id,
        'mode': 'edit'
    })

    received = socketio_client.get_received()
    error_msg = next(msg for msg in received if msg['name'] == 'error')
    assert 'already in room' in error_msg['args'][0]['message'].lower()

def test_connection_timeout(socketio_client, test_universe):
    """Test handling of connection timeouts."""
    # Simulate long delay
    import time
    time.sleep(5)  # Assuming server timeout is less than this

    # Try to send message after timeout
    socketio_client.emit('parameter_update', {
        'parameters': {'physics': {'gravity': 9.81}}
    })

    # Should receive disconnect event
    received = socketio_client.get_received()
    assert any(msg['name'] == 'disconnect' for msg in received)

def test_invalid_universe_access(socketio_client, test_universe):
    """Test handling of invalid universe access."""
    # Try to join room for universe without permission
    test_universe.is_public = False
    db.session.commit()

    socketio_client.emit('join_room', {
        'universe_id': test_universe.id,
        'mode': 'edit'
    })

    received = socketio_client.get_received()
    error_msg = next(msg for msg in received if msg['name'] == 'error')
    assert 'access denied' in error_msg['args'][0]['message'].lower()

def test_concurrent_connection_limit(app, test_user):
    """Test handling of concurrent connection limit."""
    # Create multiple clients
    clients = [SocketIOTestClient(app, app.websocket_manager.socketio)
              for _ in range(6)]  # Assuming limit is 5

    # Try to connect all clients
    for client in clients:
        client.connect()

    # Last client should receive error
    received = clients[-1].get_received()
    error_msg = next(msg for msg in received if msg['name'] == 'error')
    assert 'maximum connection limit' in error_msg['args'][0]['message'].lower()

def test_invalid_event_name(socketio_client):
    """Test handling of invalid event names."""
    socketio_client.emit('nonexistent_event', {})

    received = socketio_client.get_received()
    error_msg = next(msg for msg in received if msg['name'] == 'error')
    assert 'invalid event' in error_msg['args'][0]['message'].lower()

def test_large_message_handling(socketio_client, test_universe):
    """Test handling of large messages."""
    # Join room
    socketio_client.emit('join_room', {
        'universe_id': test_universe.id,
        'mode': 'edit'
    })
    socketio_client.get_received()

    # Create large message
    large_data = {'data': 'x' * (1024 * 1024)}  # 1MB of data
    socketio_client.emit('parameter_update', {'parameters': large_data})

    received = socketio_client.get_received()
    error_msg = next(msg for msg in received if msg['name'] == 'error')
    assert 'message too large' in error_msg['args'][0]['message'].lower()

def test_reconnection_with_pending_messages(socketio_client, test_universe):
    """Test handling of pending messages during reconnection."""
    # Join room and send message
    socketio_client.emit('join_room', {
        'universe_id': test_universe.id,
        'mode': 'edit'
    })
    socketio_client.get_received()

    # Disconnect and send message (should be queued)
    socketio_client.disconnect()
    params = {'physics': {'gravity': 9.81}}
    socketio_client.emit('parameter_update', {'parameters': params})

    # Reconnect and verify message was not lost
    socketio_client.connect()
    received = socketio_client.get_received()
    assert any(msg['name'] == 'error' and
              'message could not be delivered' in msg['args'][0]['message'].lower()
              for msg in received)
