"""Physics WebSocket tests."""
import pytest
from flask_socketio import SocketIOTestClient
from app.models import Universe, PhysicsParameters
from app.extensions import socketio

@pytest.fixture
def socket_client(app):
    """Create WebSocket test client."""
    return SocketIOTestClient(app, socketio)

def test_physics_connection(socket_client):
    """Test WebSocket connection."""
    socket_client.connect('/physics')
    received = socket_client.get_received('/physics')
    assert len(received) == 1
    assert received[0]['name'] == 'connected'

def test_join_simulation(socket_client, test_universe):
    """Test joining a physics simulation."""
    socket_client.connect('/physics')
    socket_client.emit('join_simulation', {'universe_id': test_universe.id})
    received = socket_client.get_received('/physics')
    assert any(msg['name'] == 'simulation_state' for msg in received)

def test_particle_creation(socket_client, test_universe):
    """Test particle creation and updates."""
    socket_client.connect('/physics')
    socket_client.emit('join_simulation', {'universe_id': test_universe.id})
    socket_client.get_received('/physics')  # Clear initial messages

    # Create particle
    particle_data = {
        'universe_id': test_universe.id,
        'position': {'x': 0, 'y': 0},
        'velocity': {'x': 1, 'y': 1},
        'mass': 1.0,
        'radius': 0.5
    }
    socket_client.emit('add_particle', particle_data)
    received = socket_client.get_received('/physics')
    assert any(msg['name'] == 'particle_added' for msg in received)

def test_simulation_updates(socket_client, test_universe):
    """Test receiving simulation updates."""
    socket_client.connect('/physics')
    socket_client.emit('join_simulation', {'universe_id': test_universe.id})
    socket_client.get_received('/physics')  # Clear initial messages

    # Add particle and wait for updates
    particle_data = {
        'universe_id': test_universe.id,
        'position': {'x': 0, 'y': 0},
        'velocity': {'x': 1, 'y': 1}
    }
    socket_client.emit('add_particle', particle_data)

    # Wait for a few update cycles
    updates = []
    for _ in range(5):
        received = socket_client.get_received('/physics')
        updates.extend([msg for msg in received if msg['name'] == 'simulation_state'])
        if updates:
            break
        socketio.sleep(0.1)

    assert len(updates) > 0
    assert 'state' in updates[0]['args'][0]

def test_boundary_updates(socket_client, test_universe):
    """Test boundary updates."""
    socket_client.connect('/physics')
    socket_client.emit('join_simulation', {'universe_id': test_universe.id})
    socket_client.get_received('/physics')  # Clear initial messages

    # Set boundary
    boundary_data = {
        'universe_id': test_universe.id,
        'type': 'bounce',
        'x_min': -5.0,
        'x_max': 5.0,
        'y_min': -5.0,
        'y_max': 5.0
    }
    socket_client.emit('set_boundary', boundary_data)
    received = socket_client.get_received('/physics')
    assert any(msg['name'] == 'boundary_updated' for msg in received)

def test_error_handling(socket_client):
    """Test error handling in WebSocket."""
    socket_client.connect('/physics')
    socket_client.get_received('/physics')  # Clear connection message

    # Try to join non-existent universe
    socket_client.emit('join_simulation', {'universe_id': 999})
    received = socket_client.get_received('/physics')
    assert any(msg['name'] == 'error' for msg in received)

def test_multiple_clients(app, test_universe):
    """Test multiple clients in same simulation."""
    client1 = SocketIOTestClient(app, socketio)
    client2 = SocketIOTestClient(app, socketio)

    # Connect both clients
    client1.connect('/physics')
    client2.connect('/physics')

    # Join same universe
    client1.emit('join_simulation', {'universe_id': test_universe.id})
    client2.emit('join_simulation', {'universe_id': test_universe.id})

    # Add particle with first client
    particle_data = {
        'universe_id': test_universe.id,
        'position': {'x': 0, 'y': 0},
        'velocity': {'x': 1, 'y': 1}
    }
    client1.emit('add_particle', particle_data)

    # Both clients should receive updates
    received1 = client1.get_received('/physics')
    received2 = client2.get_received('/physics')

    assert any(msg['name'] == 'particle_added' for msg in received1)
    assert any(msg['name'] == 'particle_added' for msg in received2)
