import pytest
import time
import threading
from flask_socketio import SocketIOTestClient
from app.models.user import User
from app.models.universe import Universe
from app import create_app, socketio, db
from flask_jwt_extended import create_access_token

def create_test_client(app, user):
    """Helper function to create a test client for a user"""
    token = create_access_token(identity=user.id)
    return SocketIOTestClient(
        app,
        socketio,
        namespace='/test',
        query_string=f"token={token}"
    )

@pytest.fixture
def multiple_users(app):
    """Create multiple test users"""
    users = []
    for i in range(5):
        user = User(
            username=f"test_user_{i}",
            email=f"test{i}@example.com"
        )
        user.set_password("password123")
        users.append(user)

    with app.app_context():
        db.session.add_all(users)
        db.session.commit()
        for user in users:
            db.session.refresh(user)

    return users

def test_concurrent_connections(app, multiple_users, test_universe):
    """Test multiple concurrent connections to the same universe"""
    clients = []
    try:
        # Create multiple clients
        for user in multiple_users:
            client = create_test_client(app, user)
            clients.append(client)

        # All clients join the same universe
        for client in clients:
            client.emit('join', {'universe_id': test_universe.id}, namespace='/test')

        time.sleep(0.2)  # Wait for joins to complete

        # Verify all clients received join notifications
        for client in clients:
            received = client.get_received(namespace='/test')
            assert any(msg['name'] == 'joined' for msg in received)

        # Test concurrent parameter updates
        for i, client in enumerate(clients):
            client.emit('parameter_update', {
                'universe_id': test_universe.id,
                'parameters': {'value': i}
            }, namespace='/test')

        time.sleep(0.2)  # Wait for updates to propagate

        # Verify all clients received all updates
        for client in clients:
            received = client.get_received(namespace='/test')
            parameter_updates = [msg for msg in received if msg['name'] == 'parameter_updated']
            assert len(parameter_updates) == len(clients)

    finally:
        # Cleanup
        for client in clients:
            if client.is_connected(namespace='/test'):
                client.disconnect(namespace='/test')

def test_reconnection_handling(app, test_user, test_universe):
    """Test client reconnection behavior"""
    client = create_test_client(app, test_user)

    try:
        # Initial connection
        client.emit('join', {'universe_id': test_universe.id}, namespace='/test')
        time.sleep(0.1)

        # Force disconnect
        client.disconnect(namespace='/test')
        time.sleep(0.1)

        # Reconnect
        client.connect(namespace='/test')
        time.sleep(0.1)

        # Verify can still join and interact
        client.emit('join', {'universe_id': test_universe.id}, namespace='/test')
        time.sleep(0.1)

        received = client.get_received(namespace='/test')
        assert any(msg['name'] == 'joined' for msg in received)

    finally:
        if client.is_connected(namespace='/test'):
            client.disconnect(namespace='/test')

def test_message_ordering(app, test_user, test_universe):
    """Test message ordering guarantees"""
    client = create_test_client(app, test_user)

    try:
        client.emit('join', {'universe_id': test_universe.id}, namespace='/test')
        time.sleep(0.1)

        # Send multiple ordered messages
        messages = []
        for i in range(10):
            message = {
                'universe_id': test_universe.id,
                'parameters': {'sequence': i}
            }
            messages.append(message)
            client.emit('parameter_update', message, namespace='/test')

        time.sleep(0.2)  # Wait for all messages

        # Verify order preservation
        received = client.get_received(namespace='/test')
        updates = [msg for msg in received if msg['name'] == 'parameter_updated']

        sequences = [update['args'][0]['parameters']['sequence']
                    for update in updates if 'parameters' in update['args'][0]]
        assert sequences == list(range(len(sequences)))

    finally:
        if client.is_connected(namespace='/test'):
            client.disconnect(namespace='/test')

def test_error_handling(app, test_user):
    """Test various error scenarios"""
    client = create_test_client(app, test_user)

    try:
        # Test joining non-existent universe
        client.emit('join', {'universe_id': 99999}, namespace='/test')
        time.sleep(0.1)
        received = client.get_received(namespace='/test')
        assert any(msg['name'] == 'error' and 'Universe not found' in msg['args'][0]['error']
                  for msg in received)

        # Test invalid message format
        client.emit('parameter_update', "invalid_format", namespace='/test')
        time.sleep(0.1)
        received = client.get_received(namespace='/test')
        assert any(msg['name'] == 'error' and 'Invalid data format' in msg['args'][0]['error']
                  for msg in received)

        # Test missing required fields
        client.emit('parameter_update', {'universe_id': 1}, namespace='/test')
        time.sleep(0.1)
        received = client.get_received(namespace='/test')
        assert any(msg['name'] == 'error' and 'Missing required data' in msg['args'][0]['error']
                  for msg in received)

    finally:
        if client.is_connected(namespace='/test'):
            client.disconnect(namespace='/test')

def test_stress_concurrent_events(app, test_user, test_universe):
    """Stress test with rapid concurrent event emissions"""
    client = create_test_client(app, test_user)

    try:
        client.emit('join', {'universe_id': test_universe.id}, namespace='/test')
        time.sleep(0.1)

        # Rapid fire multiple events
        event_count = 50
        start_time = time.time()

        for i in range(event_count):
            client.emit('parameter_update', {
                'universe_id': test_universe.id,
                'parameters': {'rapid_update': i}
            }, namespace='/test')

        # Wait for all events to be processed
        time.sleep(1)

        # Verify events were handled
        received = client.get_received(namespace='/test')
        updates = [msg for msg in received if msg['name'] == 'parameter_updated']

        # Check performance
        end_time = time.time()
        processing_time = end_time - start_time

        print(f"Processed {len(updates)} events in {processing_time:.2f} seconds")
        assert len(updates) > 0  # Should have received some updates

    finally:
        if client.is_connected(namespace='/test'):
            client.disconnect(namespace='/test')
