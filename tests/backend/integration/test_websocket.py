import pytest
import json
from flask_socketio import SocketIOTestClient
from app.models.user import User
from app.models.universe import Universe
from app import create_app, socketio, db
import time
from tests.conftest import socketio_client  # Use absolute import

@pytest.fixture
def test_universe(test_user):
    """Create a test universe"""
    universe = Universe(
        name="Test Universe",
        owner_id=test_user.id,
        description="Test Description",
        is_public=True
    )
    db.session.add(universe)
    db.session.commit()
    return universe

def test_socket_connection(socketio_client):
    """Test basic socket connection"""
    assert socketio_client.is_connected(namespace='/test') is True

def test_join_universe(socketio_client, test_universe):
    """Test joining a universe room"""
    socketio_client.emit('join', {'universe_id': test_universe.id}, namespace='/test')
    time.sleep(0.1)  # Wait for response
    received = socketio_client.get_received(namespace='/test')
    assert len(received) > 0
    assert received[0]['name'] == 'joined'
    assert received[0]['args'][0]['status'] == 'success'

def test_leave_universe(socketio_client, test_universe):
    """Test leaving a universe room"""
    # First join
    socketio_client.emit('join', {'universe_id': test_universe.id}, namespace='/test')
    time.sleep(0.1)
    socketio_client.get_received(namespace='/test')  # Clear received messages

    # Then leave
    socketio_client.emit('leave', {'universe_id': test_universe.id}, namespace='/test')
    time.sleep(0.1)
    received = socketio_client.get_received(namespace='/test')
    assert len(received) > 0
    assert received[0]['name'] == 'left'
    assert received[0]['args'][0]['status'] == 'success'

def test_parameter_update(socketio_client, test_universe):
    """Test updating universe parameters"""
    # Join universe first
    socketio_client.emit('join', {'universe_id': test_universe.id}, namespace='/test')
    time.sleep(0.1)
    socketio_client.get_received(namespace='/test')  # Clear received messages

    # Update parameters
    new_params = {
        'physics': {
            'gravity': 7.0
        }
    }
    socketio_client.emit('parameter_update', {
        'universe_id': test_universe.id,
        'parameters': new_params
    }, namespace='/test')
    time.sleep(0.1)
    received = socketio_client.get_received(namespace='/test')
    assert len(received) > 0
    assert received[0]['name'] == 'parameter_updated'
    assert 'parameters' in received[0]['args'][0]

def test_simulation_control(socketio_client, test_universe):
    """Test simulation control events"""
    # Join universe first
    socketio_client.emit('join', {'universe_id': test_universe.id}, namespace='/test')
    time.sleep(0.1)
    socketio_client.get_received(namespace='/test')  # Clear received messages

    # Start simulation
    socketio_client.emit('start_simulation', {'universe_id': test_universe.id}, namespace='/test')
    time.sleep(0.1)
    received = socketio_client.get_received(namespace='/test')
    assert len(received) > 0
    assert received[0]['name'] == 'simulation_started'
    assert received[0]['args'][0]['status'] == 'success'

def test_unauthorized_access(app):
    """Test unauthorized WebSocket access"""
    client = SocketIOTestClient(
        app,
        socketio,
        namespace='/test'
    )
    try:
        time.sleep(0.1)  # Wait for connection
        client.emit('test_connection', {}, namespace='/test')
        time.sleep(0.1)
        received = client.get_received(namespace='/test')
        assert len(received) > 0
        assert received[0]['name'] == 'error'
        assert 'No token provided' in received[0]['args'][0]['error']
    finally:
        if client.is_connected(namespace='/test'):
            client.disconnect(namespace='/test')

def test_invalid_universe(socketio_client):
    """Test joining non-existent universe"""
    socketio_client.emit('join', {'universe_id': 999999}, namespace='/test')
    time.sleep(0.1)
    received = socketio_client.get_received(namespace='/test')
    assert len(received) > 0
    assert received[0]['name'] == 'error'
    assert 'Universe not found' in received[0]['args'][0]['error']

def test_multiple_clients(app, test_universe):
    """Test multiple clients interacting with the same universe"""
    # Create two users
    user1 = User(username="user1", email="user1@example.com")
    user1.set_password("password123")
    user2 = User(username="user2", email="user2@example.com")
    user2.set_password("password123")
    db.session.add_all([user1, user2])
    db.session.commit()

    # Create socket clients for both users
    from flask_jwt_extended import create_access_token
    token1 = create_access_token(identity=user1.id)
    token2 = create_access_token(identity=user2.id)

    client1 = SocketIOTestClient(
        app,
        socketio,
        namespace='/test',
        query_string=f"token={token1}"
    )
    client2 = SocketIOTestClient(
        app,
        socketio,
        namespace='/test',
        query_string=f"token={token2}"
    )

    try:
        # Both clients join universe
        client1.emit('join', {'universe_id': test_universe.id}, namespace='/test')
        client2.emit('join', {'universe_id': test_universe.id}, namespace='/test')
        time.sleep(0.1)

        # Clear initial messages
        client1.get_received(namespace='/test')
        client2.get_received(namespace='/test')

        # First user updates parameters
        update_data = {
            'universe_id': test_universe.id,
            'parameters': {
                'physics': {
                    'gravity': 7.0
                }
            }
        }
        client1.emit('parameter_update', update_data, namespace='/test')
        time.sleep(0.1)

        # Both clients should receive the update
        received1 = client1.get_received(namespace='/test')
        received2 = client2.get_received(namespace='/test')
        assert len(received1) > 0 and len(received2) > 0
        assert received1[0]['name'] == 'parameter_updated'
        assert received2[0]['name'] == 'parameter_updated'
    finally:
        # Cleanup
        if client1.is_connected(namespace='/test'):
            client1.disconnect(namespace='/test')
        if client2.is_connected(namespace='/test'):
            client2.disconnect(namespace='/test')

def test_websocket_connection(app, socketio_client):
    """Test basic WebSocket connection."""
    assert socketio_client.is_connected(namespace='/test')

def test_universe_join_leave(app, socketio_client, test_universe):
    """Test joining and leaving universe rooms."""
    # Join universe
    socketio_client.emit('join', {'universe_id': test_universe.id}, namespace='/test')
    received = socketio_client.get_received(namespace='/test')
    assert len(received) > 0
    join_event = next(e for e in received if e['name'] == 'join_response')
    assert join_event['args'][0]['status'] == 'success'
    assert 'universe' in join_event['args'][0]

    # Leave universe
    socketio_client.emit('leave', {'universe_id': test_universe.id}, namespace='/test')
    received = socketio_client.get_received(namespace='/test')
    assert len(received) > 0
    leave_event = next(e for e in received if e['name'] == 'leave_response')
    assert leave_event['args'][0]['status'] == 'success'

def test_parameter_updates(app, socketio_client, test_universe):
    """Test universe parameter updates through WebSocket."""
    # Join universe first
    socketio_client.emit('join', {'universe_id': test_universe.id}, namespace='/test')
    socketio_client.get_received(namespace='/test')  # Clear received events

    # Update physics parameters
    update_data = {
        'universe_id': test_universe.id,
        'parameters': {
            'physics': {
                'gravity': 5.0,
                'time_dilation': 2.0
            }
        }
    }
    socketio_client.emit('parameter_update', update_data, namespace='/test')
    received = socketio_client.get_received(namespace='/test')
    assert len(received) > 0
    update_event = next(e for e in received if e['name'] == 'parameters_updated')
    assert update_event['args'][0]['parameters']['physics']['gravity'] == 5.0
    assert update_event['args'][0]['parameters']['physics']['time_dilation'] == 2.0

def test_real_time_collaboration(app, socketio_client, test_universe):
    """Test real-time collaboration features."""
    # Join universe
    socketio_client.emit('join', {'universe_id': test_universe.id}, namespace='/test')
    socketio_client.get_received(namespace='/test')  # Clear received events

    # Test cursor position update
    cursor_data = {
        'universe_id': test_universe.id,
        'position': {'x': 100, 'y': 200},
        'user_id': 1
    }
    socketio_client.emit('cursor_update', cursor_data, namespace='/test')
    received = socketio_client.get_received(namespace='/test')
    assert len(received) > 0
    cursor_event = next(e for e in received if e['name'] == 'cursor_moved')
    assert cursor_event['args'][0]['position'] == {'x': 100, 'y': 200}

def test_error_handling(app, socketio_client):
    """Test WebSocket error handling."""
    # Test joining non-existent universe
    socketio_client.emit('join', {'universe_id': 9999}, namespace='/test')
    received = socketio_client.get_received(namespace='/test')
    assert len(received) > 0
    error_event = next(e for e in received if e['name'] == 'error')
    assert 'Universe not found' in error_event['args'][0]['message']

    # Test invalid parameter update
    invalid_update = {
        'universe_id': 9999,
        'parameters': {'invalid': 'data'}
    }
    socketio_client.emit('parameter_update', invalid_update, namespace='/test')
    received = socketio_client.get_received(namespace='/test')
    assert len(received) > 0
    error_event = next(e for e in received if e['name'] == 'error')
    assert 'Invalid parameters' in error_event['args'][0]['message']

def test_authentication(app, unauthenticated_socketio_client, test_universe):
    """Test WebSocket authentication."""
    # Try to join universe without authentication
    unauthenticated_socketio_client.emit('join', {'universe_id': test_universe.id}, namespace='/test')
    received = unauthenticated_socketio_client.get_received(namespace='/test')
    assert len(received) > 0
    error_event = next(e for e in received if e['name'] == 'error')
    assert 'Authentication required' in error_event['args'][0]['message']

def test_heartbeat(app, socketio_client):
    """Test WebSocket heartbeat mechanism."""
    # Send heartbeat
    socketio_client.emit('heartbeat', namespace='/test')
    received = socketio_client.get_received(namespace='/test')
    assert len(received) > 0
    heartbeat_event = next(e for e in received if e['name'] == 'heartbeat_response')
    assert heartbeat_event['args'][0]['status'] == 'alive'
