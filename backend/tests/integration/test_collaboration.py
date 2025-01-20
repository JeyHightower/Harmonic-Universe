import pytest
from flask_socketio import SocketIOTestClient
from datetime import datetime, timedelta
from app import create_app
from app.extensions import db
from app.models import User, Universe, PhysicsParameters, MusicParameters, VisualizationParameters

@pytest.fixture
def app():
    app = create_app('testing')
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def test_users(app):
    """Create multiple test users."""
    users = []
    for i in range(3):
        user = User(username=f'testuser{i}', email=f'test{i}@example.com')
        user.set_password('password123')
        db.session.add(user)
        users.append(user)
    db.session.commit()
    return users

@pytest.fixture
def test_universe(app, test_users):
    """Create a test universe with parameters."""
    universe = Universe(
        name='Test Universe',
        description='Test Description',
        user_id=test_users[0].id,
        is_public=True
    )
    db.session.add(universe)
    db.session.commit()

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

@pytest.fixture
def socketio_clients(app, test_users):
    """Create multiple SocketIO test clients."""
    clients = []
    for user in test_users:
        client = SocketIOTestClient(app, app.websocket_manager.socketio)
        client.user = user  # Attach user to client for reference
        clients.append(client)
    return clients

def test_real_time_parameter_sync(socketio_clients, test_universe):
    """Test real-time parameter synchronization between clients."""
    owner, participant1, participant2 = socketio_clients

    # All clients join the same room
    room_data = {'universe_id': test_universe.id, 'mode': 'edit'}
    for client in [owner, participant1, participant2]:
        client.emit('join_room', room_data)
        received = client.get_received()
        assert any(msg['name'] == 'room_joined' for msg in received)

    # Owner updates parameters
    new_params = {
        'physics': {'gravity': 5.0},
        'music': {'tempo': 140},
        'visualization': {'brightness': 0.9}
    }
    owner.emit('parameter_update', {'parameters': new_params})

    # Verify all clients receive the update
    for client in [participant1, participant2]:
        received = client.get_received()
        update_msg = next(msg for msg in received if msg['name'] == 'parameter_update')
        assert update_msg['args'][0]['parameters'] == new_params

def test_music_generation_sync(socketio_clients, test_universe):
    """Test music generation and synchronization."""
    owner, participant1, _ = socketio_clients

    # Join room
    room_data = {'universe_id': test_universe.id, 'mode': 'edit'}
    for client in [owner, participant1]:
        client.emit('join_room', room_data)
        client.get_received()

    # Request music generation
    owner.emit('music_generation', {
        'duration': 30,
        'start_time': 0
    })

    # Verify both clients receive music update
    for client in [owner, participant1]:
        received = client.get_received()
        music_msg = next(msg for msg in received if msg['name'] == 'music_update')
        assert 'notes' in music_msg['args'][0]

def test_visualization_update_sync(socketio_clients, test_universe):
    """Test visualization updates and synchronization."""
    owner, participant1, _ = socketio_clients

    # Join room
    room_data = {'universe_id': test_universe.id, 'mode': 'edit'}
    for client in [owner, participant1]:
        client.emit('join_room', room_data)
        client.get_received()

    # Request visualization update
    visual_data = {
        'width': 800,
        'height': 600,
        'quality': 'high'
    }
    owner.emit('visualization_update', visual_data)

    # Verify both clients receive visualization update
    for client in [owner, participant1]:
        received = client.get_received()
        visual_msg = next(msg for msg in received if msg['name'] == 'visualization_update')
        assert visual_msg['args'][0] == visual_data

def test_audio_analysis_sync(socketio_clients, test_universe):
    """Test audio analysis data synchronization."""
    owner, participant1, _ = socketio_clients

    # Join room
    room_data = {'universe_id': test_universe.id, 'mode': 'edit'}
    for client in [owner, participant1]:
        client.emit('join_room', room_data)
        client.get_received()

    # Send audio analysis data
    analysis_data = {
        'frequencies': {
            'bass': 0.8,
            'mid': 0.6,
            'high': 0.4
        }
    }
    owner.emit('audio_analysis', analysis_data)

    # Verify participant receives the analysis data
    received = participant1.get_received()
    analysis_msg = next(msg for msg in received if msg['name'] == 'audio_analysis')
    assert analysis_msg['args'][0] == analysis_data

def test_collaboration_mode_restrictions(socketio_clients, test_universe):
    """Test collaboration mode restrictions."""
    owner, participant1, _ = socketio_clients

    # Join room in view mode
    room_data = {'universe_id': test_universe.id, 'mode': 'view'}
    participant1.emit('join_room', room_data)
    participant1.get_received()

    # Attempt parameter update in view mode
    new_params = {
        'physics': {'gravity': 5.0}
    }
    participant1.emit('parameter_update', {'parameters': new_params})

    # Verify error response
    received = participant1.get_received()
    error_msg = next(msg for msg in received if msg['name'] == 'error')
    assert 'view mode' in error_msg['args'][0]['message'].lower()

def test_state_recovery_after_reconnection(socketio_clients, test_universe):
    """Test state recovery after client reconnection."""
    owner, participant1, _ = socketio_clients

    # Initial room join
    room_data = {'universe_id': test_universe.id, 'mode': 'edit'}
    for client in [owner, participant1]:
        client.emit('join_room', room_data)
        client.get_received()

    # Update parameters
    new_params = {
        'physics': {'gravity': 5.0},
        'music': {'tempo': 140}
    }
    owner.emit('parameter_update', {'parameters': new_params})

    # Simulate disconnection and reconnection
    participant1.disconnect()
    participant1.connect()
    participant1.emit('join_room', room_data)

    # Verify state is recovered
    received = participant1.get_received()
    state_msg = next(msg for msg in received if msg['name'] == 'room_joined')
    assert state_msg['args'][0]['room']['parameters'] == new_params

def test_concurrent_updates_handling(socketio_clients, test_universe):
    """Test handling of concurrent parameter updates."""
    owner, participant1, participant2 = socketio_clients

    # All clients join the room
    room_data = {'universe_id': test_universe.id, 'mode': 'edit'}
    for client in [owner, participant1, participant2]:
        client.emit('join_room', room_data)
        client.get_received()

    # Simulate concurrent updates
    updates = [
        ({'physics': {'gravity': 5.0}}, owner),
        ({'physics': {'gravity': 6.0}}, participant1),
        ({'physics': {'gravity': 7.0}}, participant2)
    ]

    for params, client in updates:
        client.emit('parameter_update', {'parameters': params})

    # Verify all clients receive updates in the same order
    received_updates = []
    for client in socketio_clients:
        received = client.get_received()
        updates = [msg['args'][0]['parameters'] for msg in received
                  if msg['name'] == 'parameter_update']
        received_updates.append(updates)

    # All clients should have the same final state
    assert all(updates == received_updates[0] for updates in received_updates)
