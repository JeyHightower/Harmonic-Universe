"""Tests for the physics simulation WebSocket handler."""
import pytest
from unittest.mock import patch, MagicMock
from flask_socketio import SocketIOTestClient
from app import create_app
from app.models import Universe, PhysicsParameters
from app.physics.engine import Vector2D, Particle, PhysicsEngine, BoundaryType
from app.extensions import db
from app.sockets.physics_handler import PhysicsNamespace
import time
import socketio
import json

@pytest.fixture(scope='function')
def app():
    """Create application for testing."""
    _app = create_app('test', testing=True)
    _app.config.update({
        'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
        'SQLALCHEMY_TRACK_MODIFICATIONS': False,
        'SOCKETIO_TEST_MODE': True,
        'SOCKETIO_MESSAGE_QUEUE': None,
        'SECRET_KEY': 'test_key'
    })

    with _app.app_context():
        db.create_all()
        yield _app
        db.session.remove()
        db.drop_all()

@pytest.fixture(scope='function')
def socketio_server(app):
    """Create a SocketIO server for testing."""
    from app.extensions import socketio
    return socketio

@pytest.fixture(scope='function')
def socket_client(app, socketio_server):
    """Create a WebSocket test client."""
    flask_test_client = app.test_client()
    socket_client = SocketIOTestClient(app, socketio_server, flask_test_client=flask_test_client, namespace='/physics')
    return socket_client

@pytest.fixture(scope='function')
def universe(app):
    """Create a test universe."""
    universe = Universe(
        name="Test Universe",
        description="A universe for testing physics",
        user_id=1
    )
    db.session.add(universe)
    db.session.commit()
    return universe

@pytest.fixture(scope='function')
def physics_parameters(app, universe):
    """Create physics parameters for testing."""
    params = PhysicsParameters(
        universe=universe,
        gravity=9.81,
        elasticity=0.7,
        friction=0.3,
        air_resistance=0.1,
        density=1.0,
        time_scale=1.0,
        max_time_step=1/60
    )
    db.session.add(params)
    db.session.commit()
    return params

@pytest.fixture(autouse=True)
def clear_namespace_state(socketio_server):
    """Clear namespace state before each test."""
    # Get the physics namespace instance
    physics_namespace = None
    for namespace in socketio_server.server.namespace_handlers.values():
        if isinstance(namespace, PhysicsNamespace):
            physics_namespace = namespace
            break

    if physics_namespace:
        physics_namespace.cleanup()

    yield

def test_client_connection(socket_client, socketio_server):
    """Test client connection and disconnection."""
    # Clear any connection events
    socket_client.get_received('/physics')

    # Connect client
    socket_client.connect('/physics')
    received = socket_client.get_received('/physics')

    # Should receive connection established event
    assert len(received) == 1
    assert received[0]['name'] == 'connection_established'
    assert 'client_id' in received[0]['args'][0]
    assert 'status' in received[0]['args'][0]
    assert received[0]['args'][0]['status'] == 'connected'

def test_join_simulation(socket_client, universe, physics_parameters, socketio_server):
    """Test joining a simulation."""
    socket_client.connect('/physics')
    socket_client.get_received('/physics')  # Clear connection event

    # Join simulation
    socket_client.emit('join_simulation', {'universe_id': universe.id}, namespace='/physics')
    received = socket_client.get_received('/physics')
    assert len(received) == 1
    assert received[0]['name'] == 'simulation_state'

def test_join_invalid_universe(socket_client, socketio_server):
    """Test joining a non-existent universe."""
    socket_client.connect('/physics')
    socket_client.get_received('/physics')  # Clear connection event

    # Try to join non-existent universe
    socket_client.emit('join_simulation', {'universe_id': 999}, namespace='/physics')
    received = socket_client.get_received('/physics')
    assert len(received) == 1
    assert received[0]['name'] == 'error'
    assert received[0]['args'][0]['message'] == 'Universe 999 not found'

def test_leave_simulation(socket_client, universe, physics_parameters, socketio_server):
    """Test leaving a simulation."""
    socket_client.connect('/physics')
    socket_client.get_received('/physics')  # Clear connection event

    # Join and then leave simulation
    socket_client.emit('join_simulation', {'universe_id': universe.id}, namespace='/physics')
    socket_client.get_received('/physics')  # Clear join event

    socket_client.emit('leave_simulation', {'universe_id': universe.id}, namespace='/physics')
    received = socket_client.get_received('/physics')
    assert len(received) == 0  # No response expected for leaving

def test_add_particle(socket_client, universe, physics_parameters, socketio_server):
    """Test adding a particle to the simulation."""
    socket_client.connect('/physics')
    socket_client.get_received('/physics')  # Clear connection event

    # Join simulation
    socket_client.emit('join_simulation', {'universe_id': universe.id}, namespace='/physics')
    socket_client.get_received('/physics')  # Clear join event

    # Add particle
    particle_data = {
        'universe_id': universe.id,
        'position': {'x': 0, 'y': 0},
        'velocity': {'x': 1, 'y': 1},
        'mass': 1.0,
        'radius': 0.5
    }
    socket_client.emit('add_particle', particle_data, namespace='/physics')
    received = socket_client.get_received('/physics')
    assert len(received) == 1
    assert received[0]['name'] == 'particle_added'

def test_clear_simulation(socket_client, universe, physics_parameters, socketio_server):
    """Test clearing all particles from a simulation."""
    socket_client.connect('/physics')
    socket_client.get_received('/physics')  # Clear connection event

    # Join simulation and add particle
    socket_client.emit('join_simulation', {'universe_id': universe.id}, namespace='/physics')
    socket_client.get_received('/physics')  # Clear join event

    particle_data = {
        'universe_id': universe.id,
        'position': {'x': 0, 'y': 0},
        'velocity': {'x': 1, 'y': 1}
    }
    socket_client.emit('add_particle', particle_data, namespace='/physics')
    socket_client.get_received('/physics')  # Clear add event

    # Clear simulation
    socket_client.emit('clear_simulation', {'universe_id': universe.id}, namespace='/physics')
    received = socket_client.get_received('/physics')
    assert len(received) == 1
    assert received[0]['name'] == 'simulation_cleared'

def test_set_boundary(socket_client, universe, physics_parameters, socketio_server):
    """Test setting simulation boundary."""
    socket_client.connect('/physics')
    socket_client.get_received('/physics')  # Clear connection event

    # Join simulation
    socket_client.emit('join_simulation', {'universe_id': universe.id}, namespace='/physics')
    socket_client.get_received('/physics')  # Clear join event

    # Set boundary
    boundary_data = {
        'universe_id': universe.id,
        'type': 'bounce',
        'x_min': -5.0,
        'x_max': 5.0,
        'y_min': -5.0,
        'y_max': 5.0,
        'elasticity': 0.8
    }
    socket_client.emit('set_boundary', boundary_data, namespace='/physics')
    received = socket_client.get_received('/physics')
    assert len(received) == 1
    assert received[0]['name'] == 'boundary_updated'

def test_error_handling(socket_client, universe, physics_parameters, socketio_server):
    """Test error handling and client disconnection after max errors."""
    socket_client.connect('/physics')
    socket_client.get_received('/physics')  # Clear connection event

    # Join simulation
    socket_client.emit('join_simulation', {'universe_id': universe.id}, namespace='/physics')
    socket_client.get_received('/physics')  # Clear join event

    # Trigger errors by sending invalid data
    for i in range(4):  # One more than max_errors
        socket_client.emit('add_particle', {'invalid': 'data'}, namespace='/physics')
        received = socket_client.get_received('/physics')
        assert len(received) == 1
        assert received[0]['name'] == 'error'
        assert 'error_count' in received[0]['args'][0]
        if i < 3:  # max_errors is 3
            assert received[0]['args'][0]['error_count'] == i + 1

def test_broadcast_updates(socket_client, universe, physics_parameters, socketio_server):
    """Test broadcasting simulation updates."""
    socket_client.connect('/physics')
    socket_client.get_received('/physics')  # Clear connection event

    # Join simulation
    socket_client.emit('join_simulation', {'universe_id': universe.id}, namespace='/physics')
    socket_client.get_received('/physics')  # Clear join event

    # Add particle
    particle_data = {
        'universe_id': universe.id,
        'position': {'x': 0, 'y': 0},
        'velocity': {'x': 1, 'y': 1}
    }
    socket_client.emit('add_particle', particle_data, namespace='/physics')
    socket_client.get_received('/physics')  # Clear add event

    # Wait for updates
    state_updates = []
    for _ in range(20):  # Try up to 20 times (about 1/3 second)
        socketio_server.sleep(1/60)  # Match broadcast task timing
        received = socket_client.get_received('/physics')
        state_updates.extend([msg for msg in received if msg['name'] == 'simulation_state'])
        if state_updates:
            break

    assert len(state_updates) > 0
    assert 'state' in state_updates[0]['args'][0]
    assert 'universe_id' in state_updates[0]['args'][0]
    assert state_updates[0]['args'][0]['universe_id'] == universe.id
