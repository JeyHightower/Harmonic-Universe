"""Test universe performance."""
import pytest
import time
from flask_socketio import SocketIOTestClient
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

    physics = PhysicsParameters(
        universe_id=universe.id,
        gravity=9.81,
        friction=0.5,
        elasticity=0.7
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
        background_color='#000000',
        particle_color='#FFFFFF',
        glow_color='#FFFFFF'
    )
    db.session.add_all([physics, music, visualization])
    db.session.commit()
    return universe

@pytest.fixture
def socketio_client(app):
    return SocketIOTestClient(app, app.websocket_manager.socketio)

def test_universe_creation_performance(app, test_user):
    """Test performance of universe creation."""
    start_time = time.time()
    universes_to_create = 10

    for i in range(universes_to_create):
        universe = Universe(
            name=f'Performance Test Universe {i}',
            description=f'Performance test description {i}',
            user_id=test_user.id,
            is_public=True
        )
        db.session.add(universe)
        db.session.commit()

        physics = PhysicsParameters(
            universe_id=universe.id,
            gravity=9.81,
            friction=0.5,
            elasticity=0.7
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
            background_color='#000000',
            particle_color='#FFFFFF',
            glow_color='#FFFFFF'
        )
        db.session.add_all([physics, music, visualization])
        db.session.commit()

    end_time = time.time()
    total_time = end_time - start_time
    avg_time = total_time / universes_to_create

    assert avg_time < 0.5  # Each universe should be created in less than 500ms

def test_parameter_update_performance(socketio_client, test_universe):
    """Test performance of parameter updates."""
    socketio_client.emit('join', {'universe_id': test_universe.id})
    socketio_client.get_received()

    start_time = time.time()
    updates_to_perform = 100

    for i in range(updates_to_perform):
        socketio_client.emit('update_parameters', {
            'universe_id': test_universe.id,
            'physics': {
                'gravity': 9.81 + (i * 0.1),
                'friction': 0.5 + (i * 0.01)
            },
            'music': {
                'tempo': 120 + i,
                'harmony': 0.5 + (i * 0.01)
            },
            'visualization': {
                'particle_count': 1000 + i,
                'glow_intensity': 0.7 + (i * 0.01)
            }
        })
        socketio_client.get_received()

    end_time = time.time()
    total_time = end_time - start_time
    avg_time = total_time / updates_to_perform

    assert avg_time < 0.05  # Each update should take less than 50ms

def test_concurrent_universe_access(app, test_universe):
    """Test performance under concurrent universe access."""
    num_clients = 10
    clients = [SocketIOTestClient(app, app.websocket_manager.socketio) for _ in range(num_clients)]

    start_time = time.time()

    # All clients join simultaneously
    for client in clients:
        client.emit('join', {'universe_id': test_universe.id})
        client.get_received()

    # Simulate concurrent parameter updates
    for i in range(10):
        for client in clients:
            client.emit('update_parameters', {
                'universe_id': test_universe.id,
                'physics': {'gravity': 9.81 + i},
                'music': {'tempo': 120 + i},
                'visualization': {'particle_count': 1000 + i}
            })
            client.get_received()

    end_time = time.time()
    total_time = end_time - start_time

    assert total_time < 5.0  # All operations should complete within 5 seconds

def test_universe_query_performance(app, test_user):
    """Test performance of universe queries."""
    # Create multiple universes
    for i in range(100):
        universe = Universe(
            name=f'Query Test Universe {i}',
            description=f'Query test description {i}',
            user_id=test_user.id,
            is_public=True
        )
        db.session.add(universe)
    db.session.commit()

    # Test different query scenarios
    start_time = time.time()

    # Query all public universes
    public_universes = Universe.query.filter_by(is_public=True).all()

    # Query user's universes
    user_universes = Universe.query.filter_by(user_id=test_user.id).all()

    # Query with parameter joins
    complex_query = Universe.query.join(PhysicsParameters).join(MusicParameters).filter(
        Universe.is_public == True,
        PhysicsParameters.gravity > 9.0,
        MusicParameters.tempo > 100
    ).all()

    end_time = time.time()
    total_query_time = end_time - start_time

    assert total_query_time < 1.0  # All queries should complete within 1 second

def test_websocket_message_performance(socketio_client, test_universe):
    """Test WebSocket message handling performance."""
    socketio_client.emit('join', {'universe_id': test_universe.id})
    socketio_client.get_received()

    message_count = 1000
    start_time = time.time()

    for i in range(message_count):
        socketio_client.emit('message', {
            'type': 'test',
            'content': f'Performance test message {i}',
            'timestamp': time.time()
        })
        socketio_client.get_received()

    end_time = time.time()
    total_time = end_time - start_time
    messages_per_second = message_count / total_time

    assert messages_per_second > 100  # Should handle at least 100 messages per second
