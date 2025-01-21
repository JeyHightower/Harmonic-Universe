"""Tests for the physics simulation WebSocket handler."""
import pytest
from unittest.mock import patch, MagicMock
from flask_socketio import SocketIOTestClient
from app import create_app
from app.config import TestConfig
from app.models import Universe, PhysicsParameters
from app.services.physics_engine import Vector2D
from app.websockets.physics_handler import (
    active_simulations,
    universe_clients,
    get_or_create_simulation
)

@pytest.fixture
def app():
    """Create test application."""
    app = create_app(TestConfig)
    return app

@pytest.fixture
def socketio_test_client(app):
    """Create test client for WebSocket connections."""
    from app.extensions import socketio
    return socketio.test_client(app)

@pytest.fixture
def test_universe(session):
    """Create a test universe with physics parameters."""
    physics_params = PhysicsParameters(
        gravity=9.81,
        elasticity=0.7,
        friction=0.3,
        air_resistance=0.1,
        density=1.0
    )
    universe = Universe(
        name='Test Universe',
        description='Test universe for WebSocket testing',
        is_public=True,
        physics_parameters=physics_params
    )
    session.add(universe)
    session.commit()
    return universe

def test_client_connection(socketio_test_client):
    """Test client connection to WebSocket server."""
    received = socketio_test_client.get_received()
    assert len(received) == 1
    assert received[0]['name'] == 'connected'
    assert 'message' in received[0]['args'][0]

def test_join_simulation(socketio_test_client, test_universe):
    """Test joining a physics simulation."""
    socketio_test_client.emit('join_simulation', {'universe_id': test_universe.id})
    received = socketio_test_client.get_received()

    # Should receive simulation state
    assert len(received) > 0
    state_event = received[-1]
    assert state_event['name'] == 'simulation_state'
    assert 'particles' in state_event['args'][0]
    assert 'time' in state_event['args'][0]
    assert 'frame' in state_event['args'][0]

    # Check that client is tracked
    assert test_universe.id in universe_clients
    assert len(universe_clients[test_universe.id]) > 0

def test_join_invalid_universe(socketio_test_client):
    """Test joining a non-existent universe."""
    socketio_test_client.emit('join_simulation', {'universe_id': 999})
    received = socketio_test_client.get_received()

    assert len(received) > 0
    error_event = received[-1]
    assert error_event['name'] == 'error'
    assert 'message' in error_event['args'][0]

def test_leave_simulation(socketio_test_client, test_universe):
    """Test leaving a physics simulation."""
    # First join
    socketio_test_client.emit('join_simulation', {'universe_id': test_universe.id})
    socketio_test_client.get_received()  # Clear received events

    # Then leave
    socketio_test_client.emit('leave_simulation', {'universe_id': test_universe.id})

    # Check that client is removed
    assert test_universe.id not in universe_clients or \
           len(universe_clients[test_universe.id]) == 0

def test_add_particle(socketio_test_client, test_universe):
    """Test adding a particle to the simulation."""
    # Join simulation first
    socketio_test_client.emit('join_simulation', {'universe_id': test_universe.id})
    socketio_test_client.get_received()  # Clear received events

    # Add particle
    particle_data = {
        'universe_id': test_universe.id,
        'x': 1.0,
        'y': 2.0,
        'vx': 3.0,
        'vy': 4.0,
        'mass': 1.0,
        'radius': 0.5
    }
    socketio_test_client.emit('add_particle', particle_data)
    received = socketio_test_client.get_received()

    assert len(received) > 0
    particle_event = received[-1]
    assert particle_event['name'] == 'particle_added'

    added_particle = particle_event['args'][0]
    assert added_particle['position']['x'] == 1.0
    assert added_particle['position']['y'] == 2.0
    assert added_particle['velocity']['x'] == 3.0
    assert added_particle['velocity']['y'] == 4.0
    assert added_particle['mass'] == 1.0
    assert added_particle['radius'] == 0.5

def test_clear_simulation(socketio_test_client, test_universe):
    """Test clearing all particles from the simulation."""
    # Join simulation first
    socketio_test_client.emit('join_simulation', {'universe_id': test_universe.id})
    socketio_test_client.get_received()  # Clear received events

    # Add a particle
    particle_data = {
        'universe_id': test_universe.id,
        'x': 0.0,
        'y': 0.0
    }
    socketio_test_client.emit('add_particle', particle_data)
    socketio_test_client.get_received()  # Clear received events

    # Clear simulation
    socketio_test_client.emit('clear_simulation', {'universe_id': test_universe.id})
    received = socketio_test_client.get_received()

    assert len(received) > 0
    clear_event = received[-1]
    assert clear_event['name'] == 'simulation_cleared'

    # Verify simulation is cleared
    engine = active_simulations.get(test_universe.id)
    assert engine is not None
    assert len(engine.particles) == 0

@pytest.mark.asyncio
async def test_broadcast_updates(socketio_test_client, test_universe):
    """Test broadcasting simulation updates to clients."""
    # Join simulation
    socketio_test_client.emit('join_simulation', {'universe_id': test_universe.id})
    socketio_test_client.get_received()  # Clear received events

    # Add a particle
    particle_data = {
        'universe_id': test_universe.id,
        'x': 0.0,
        'y': 10.0,
        'vx': 0.0,
        'vy': 0.0,
        'mass': 1.0
    }
    socketio_test_client.emit('add_particle', particle_data)
    socketio_test_client.get_received()  # Clear received events

    # Mock sleep to speed up test
    with patch('asyncio.sleep', return_value=None):
        # Get engine and run a few updates
        engine = active_simulations[test_universe.id]
        for _ in range(5):
            state = engine.update(1/60)

            # Verify particle is falling due to gravity
            particle = state['particles'][0]
            assert particle['position']['y'] < 10.0  # Should fall due to gravity
            assert particle['velocity']['y'] < 0.0  # Negative velocity due to gravity

def test_simulation_cleanup(socketio_test_client, test_universe):
    """Test cleanup of simulations when all clients disconnect."""
    # Join simulation
    socketio_test_client.emit('join_simulation', {'universe_id': test_universe.id})
    socketio_test_client.get_received()  # Clear received events

    # Verify simulation exists
    assert test_universe.id in active_simulations
    assert test_universe.id in universe_clients

    # Disconnect client
    socketio_test_client.disconnect()

    # Verify cleanup
    assert test_universe.id not in active_simulations
    assert test_universe.id not in universe_clients

def test_multiple_clients(app, test_universe):
    """Test multiple clients connecting to the same simulation."""
    from app.extensions import socketio

    # Create two test clients
    client1 = socketio.test_client(app)
    client2 = socketio.test_client(app)

    # Both clients join the same simulation
    client1.emit('join_simulation', {'universe_id': test_universe.id})
    client2.emit('join_simulation', {'universe_id': test_universe.id})

    # Verify both clients are tracked
    assert test_universe.id in universe_clients
    assert len(universe_clients[test_universe.id]) == 2

    # Add particle through client1
    particle_data = {
        'universe_id': test_universe.id,
        'x': 1.0,
        'y': 1.0
    }
    client1.emit('add_particle', particle_data)

    # Both clients should receive the particle_added event
    received1 = client1.get_received()
    received2 = client2.get_received()

    assert any(event['name'] == 'particle_added' for event in received1)
    assert any(event['name'] == 'particle_added' for event in received2)

    # Disconnect one client
    client1.disconnect()

    # Verify simulation still exists (one client still connected)
    assert test_universe.id in active_simulations
    assert test_universe.id in universe_clients
    assert len(universe_clients[test_universe.id]) == 1

    # Disconnect second client
    client2.disconnect()

    # Verify complete cleanup
    assert test_universe.id not in active_simulations
    assert test_universe.id not in universe_clients
