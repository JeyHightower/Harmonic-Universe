"""Tests for the physics simulation WebSocket handler."""
import pytest
import logging
from unittest.mock import patch, MagicMock
from flask import Flask
from flask_socketio import SocketIOTestClient
from app import create_app
from app.config import TestConfig
from app.models.base import Universe, PhysicsParameters
from app.physics.engine import Vector2D
from app.sockets.physics_handler import PhysicsNamespace
from app.extensions import db, socketio

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

@pytest.fixture(scope='function')
def app():
    """Create application for testing."""
    _app = Flask(__name__)
    _app.config.update({
        'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
        'SQLALCHEMY_TRACK_MODIFICATIONS': False,
        'SOCKETIO_TEST_MODE': True,
        'SOCKETIO_MESSAGE_QUEUE': None,
        'SECRET_KEY': 'test_key',
        'TESTING': True,
        'DEBUG': True
    })

    # Initialize extensions
    db.init_app(_app)
    socketio.init_app(_app, message_queue=None, async_mode='eventlet', logger=True, engineio_logger=True)

    # Register physics namespace
    physics_namespace = PhysicsNamespace('/physics')
    socketio.on_namespace(physics_namespace)

    with _app.app_context():
        db.create_all()
        # Start the background task
        physics_namespace.app = _app
        physics_namespace._stop_event.clear()
        physics_namespace.update_task = socketio.start_background_task(target=physics_namespace.broadcast_updates)
        logger.info(f"Started background task: {physics_namespace.update_task}")
        yield _app
        # Stop the background task before cleanup
        logger.info("Cleaning up app")
        physics_namespace.cleanup()
        db.session.remove()
        db.drop_all()

@pytest.fixture(scope='function')
def socket_client(app):
    """Create a WebSocket test client."""
    logger.info("Creating socket client")
    flask_test_client = app.test_client()
    client = socketio.test_client(app, namespace='/physics')
    logger.info(f"Socket client connected: {client.is_connected('/physics')}")
    assert client.is_connected('/physics'), "Socket client failed to connect to /physics namespace"
    return client

@pytest.fixture(scope='function')
def test_universe(app):
    """Create a test universe with physics parameters."""
    universe = Universe(
        name='Test Universe',
        description='Test universe for WebSocket testing',
        is_public=True,
        user_id=1  # Required field
    )
    db.session.add(universe)
    db.session.commit()

    physics_params = PhysicsParameters(
        universe_id=universe.id,
        gravity=9.81,
        elasticity=0.7,
        friction=0.3,
        air_resistance=0.1,
        density=1.0
    )
    db.session.add(physics_params)
    db.session.commit()

    return universe

def test_client_connection(socket_client):
    """Test client connection to WebSocket server."""
    received = socket_client.get_received('/physics')
    assert len(received) == 1
    assert received[0]['name'] == 'connection_established'
    assert 'client_id' in received[0]['args'][0]
    assert received[0]['args'][0]['status'] == 'connected'

def test_join_simulation(socket_client, test_universe):
    """Test joining a physics simulation."""
    socket_client.emit('join_simulation', {'universe_id': test_universe.id}, namespace='/physics')
    received = socket_client.get_received('/physics')

    # Should receive simulation state
    assert len(received) > 0
    state_event = received[-1]
    assert state_event['name'] == 'simulation_state'
    assert 'state' in state_event['args'][0]
    assert 'universe_id' in state_event['args'][0]
    assert state_event['args'][0]['universe_id'] == test_universe.id

def test_add_particle(socket_client, test_universe):
    """Test adding a particle to the simulation."""
    # Join simulation first
    socket_client.emit('join_simulation', {'universe_id': test_universe.id}, namespace='/physics')
    socket_client.get_received('/physics')  # Clear received events

    # Add particle with correct data structure
    socket_client.emit('add_particle', {
        'universe_id': test_universe.id,
        'particle': {
            'position': {'x': 0, 'y': 0},
            'velocity': {'x': 1, 'y': 1},
            'mass': 1.0,
            'radius': 0.5
        }
    }, namespace='/physics')
    received = socket_client.get_received('/physics')

    assert len(received) > 0
    update_event = received[-1]
    assert update_event['name'] == 'simulation_state'
    assert 'args' in update_event
    assert len(update_event['args']) > 0
    state = update_event['args'][0]
    assert 'state' in state
    assert 'universe_id' in state
    assert state['universe_id'] == test_universe.id

def test_broadcast_updates(socket_client, test_universe):
    """Test that simulation updates are broadcast to connected clients."""
    logger.info("Starting broadcast updates test")

    # Join simulation
    socket_client.emit('join_simulation', {'universe_id': test_universe.id}, namespace='/physics')
    logger.info(f"Joined simulation {test_universe.id}")

    # Wait for initial state
    received = []
    max_retries = 10
    for _ in range(max_retries):
        socketio.sleep(0.2)  # Wait for initial state
        received = socket_client.get_received('/physics')
        if received:
            break

    assert len(received) > 0, "No initial state received"
    logger.info(f"Received initial state: {received}")

    # Clear received messages
    socket_client.get_received('/physics')

    # Add a particle
    socket_client.emit('add_particle', {
        'universe_id': test_universe.id,
        'particle': {
            'position': {'x': 0, 'y': 0},
            'velocity': {'x': 1, 'y': 1},
            'mass': 1.0,
            'radius': 0.5
        }
    }, namespace='/physics')
    logger.info("Added particle")

    # Wait for updates
    received = []
    max_retries = 20
    for i in range(max_retries):
        socketio.sleep(0.2)  # Wait longer between checks
        received = socket_client.get_received('/physics')
        logger.info(f"Check {i+1}/{max_retries}: Received {len(received)} messages")
        if received:
            break

    assert len(received) > 0, "No simulation updates received"
    logger.info(f"Final received updates: {received}")

    # Verify update format
    update = received[0]
    assert update['name'] == 'simulation_state'
    assert 'args' in update
    assert len(update['args']) > 0
    state_update = update['args'][0]
    assert 'state' in state_update
    assert 'universe_id' in state_update
    assert state_update['universe_id'] == test_universe.id
