import pytest
from flask_socketio import SocketIOTestClient
from app import create_app
from app.extensions import db
from app.models import Universe, User, PhysicsParameters, MusicParameters, VisualizationParameters
from ..config import TestConfig

@pytest.fixture
def app():
    app = create_app(TestConfig)
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

def test_physics_music_sync(socketio_client, test_universe):
    """Test synchronization between physics and music parameters."""
    # Join universe room
    socketio_client.emit('join', {'universe_id': test_universe.id})
    socketio_client.get_received()

    # Update physics parameters
    socketio_client.emit('update_parameters', {
        'universe_id': test_universe.id,
        'physics': {
            'gravity': 15.0,
            'friction': 0.8
        }
    })

    # Verify music parameters were automatically adjusted
    received = socketio_client.get_received()
    music_msg = next(msg for msg in received if msg['name'] == 'parameter_update')
    assert 'music' in music_msg['args'][0]
    music_params = music_msg['args'][0]['music']

    # Higher gravity should increase tempo
    assert music_params['tempo'] > 120

def test_music_visualization_sync(socketio_client, test_universe):
    """Test synchronization between music and visualization parameters."""
    # Join universe room
    socketio_client.emit('join', {'universe_id': test_universe.id})
    socketio_client.get_received()

    # Update music parameters
    socketio_client.emit('update_parameters', {
        'universe_id': test_universe.id,
        'music': {
            'key': 'G',
            'scale': 'minor'
        }
    })

    # Verify visualization parameters were automatically adjusted
    received = socketio_client.get_received()
    visual_msg = next(msg for msg in received if msg['name'] == 'parameter_update')
    assert 'visualization' in visual_msg['args'][0]
    visual_params = visual_msg['args'][0]['visualization']

    # Minor scale should affect color scheme
    assert visual_params['particle_color'] != '#FFFFFF'

def test_concurrent_parameter_updates(socketio_client, test_universe):
    """Test handling of concurrent parameter updates."""
    # Join universe room
    socketio_client.emit('join', {'universe_id': test_universe.id})
    socketio_client.get_received()

    # Simulate concurrent updates
    socketio_client.emit('update_parameters', {
        'universe_id': test_universe.id,
        'physics': {'gravity': 12.0},
        'music': {'tempo': 140},
        'visualization': {'particle_count': 2000}
    })

    # Verify all parameters were updated correctly
    received = socketio_client.get_received()
    update_msg = next(msg for msg in received if msg['name'] == 'parameter_update')
    params = update_msg['args'][0]

    assert params['physics']['gravity'] == 12.0
    assert params['music']['tempo'] == 140
    assert params['visualization']['particle_count'] == 2000

def test_parameter_validation_error_handling(socketio_client, test_universe):
    """Test error handling for invalid parameter updates."""
    # Join universe room
    socketio_client.emit('join', {'universe_id': test_universe.id})
    socketio_client.get_received()

    # Try to update with invalid parameters
    socketio_client.emit('update_parameters', {
        'universe_id': test_universe.id,
        'physics': {'gravity': -1.0},  # Invalid: negative gravity
        'music': {'tempo': 300},       # Invalid: tempo too high
        'visualization': {'particle_count': 20000}  # Invalid: too many particles
    })

    # Verify error response
    received = socketio_client.get_received()
    error_msg = next(msg for msg in received if msg['name'] == 'error')
    assert 'validation_errors' in error_msg['args'][0]
    errors = error_msg['args'][0]['validation_errors']

    assert 'physics' in errors
    assert 'music' in errors
    assert 'visualization' in errors
