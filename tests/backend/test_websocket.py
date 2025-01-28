import pytest
from datetime import datetime, timedelta
import time
from .conftest import (
    verify_event_received,
    verify_event_not_received,
    emit_and_verify,
    create_test_token
)
from flask_jwt_extended import create_access_token
from flask_socketio import SocketIO
from app import create_app, db
from app.models import User, Universe
import json

def create_test_token(user_id, expires_delta=None):
    """Create a test JWT token."""
    if expires_delta is None:
        expires_delta = timedelta(hours=1)
    return create_access_token(
        identity=user_id,
        expires_delta=expires_delta
    )

def test_unauthenticated_connection(unauthenticated_socketio_client):
    """Test that unauthenticated clients can connect."""
    client = unauthenticated_socketio_client
    assert client._connected
    assert client.eio_sid is not None

def test_authenticated_connection(auth_socketio_client, test_user):
    """Test that authenticated clients can connect with valid token."""
    client = auth_socketio_client
    assert client._connected
    assert client.eio_sid is not None

    # Verify user data is attached to session
    assert hasattr(client, 'user_id')
    assert client.user_id == test_user.id

def test_invalid_token_connection(socketio):
    """Test that clients with invalid tokens cannot connect."""
    invalid_token = create_test_token(999)  # Non-existent user ID
    client = socketio.test_client(
        app,
        auth={'token': invalid_token}
    )
    assert not client._connected

def test_expired_token_connection(socketio, test_user):
    """Test that clients with expired tokens cannot connect."""
    expired_token = create_test_token(
        test_user.id,
        expires_delta=timedelta(seconds=-1)
    )
    client = socketio.test_client(
        app,
        auth={'token': expired_token}
    )
    assert not client._connected

def test_event_broadcast(two_connected_clients):
    """Test broadcasting events to all connected clients."""
    client1, client2 = two_connected_clients

    # Client 1 emits event
    event_data = {'message': 'Hello World'}
    client1.emit('test_event', event_data)

    # Both clients should receive it
    verify_event_received(client1, 'test_event', event_data)
    verify_event_received(client2, 'test_event', event_data)

def test_private_message(two_connected_clients):
    """Test sending private messages between clients."""
    client1, client2 = two_connected_clients

    # Client 1 sends private message to client 2
    event_data = {
        'recipient_sid': client2.eio_sid,
        'message': 'Private Hello'
    }
    client1.emit('private_message', event_data)

    # Only client 2 should receive it
    verify_event_received(client2, 'private_message', event_data)
    verify_event_not_received(client1, 'private_message')

def test_room_message(universe_with_connected_clients):
    """Test sending messages to specific rooms."""
    universe, clients = universe_with_connected_clients
    client1, client2, client3 = clients

    # Join clients 1 and 2 to a room
    room_name = 'test_room'
    client1.emit('join', {'room': room_name})
    client2.emit('join', {'room': room_name})

    # Send message to room
    event_data = {'room': room_name, 'message': 'Room Message'}
    client1.emit('room_message', event_data)

    # Clients 1 and 2 should receive it, but not client 3
    verify_event_received(client1, 'room_message', event_data)
    verify_event_received(client2, 'room_message', event_data)
    verify_event_not_received(client3, 'room_message')

def test_disconnect_cleanup(auth_socketio_client):
    """Test proper cleanup on client disconnect."""
    client = auth_socketio_client
    assert client._connected

    # Store SID for verification
    sid = client.eio_sid

    # Disconnect
    client.disconnect()
    assert not client._connected
    assert client.eio_sid is None

    # Verify cleanup in connected_clients
    def verify_cleanup(response):
        assert sid not in response['clients']

    client.emit('get_connected_clients', callback=verify_cleanup)

def test_reconnection(auth_socketio_client):
    """Test client reconnection behavior."""
    client = auth_socketio_client
    original_sid = client.eio_sid

    # Disconnect and reconnect
    client.disconnect()
    time.sleep(0.1)  # Small delay to ensure disconnect processed
    client.connect()

    # Verify new session created
    assert client._connected
    assert client.eio_sid is not None
    assert client.eio_sid != original_sid

def test_event_validation(auth_socketio_client):
    """Test event data validation."""
    client = auth_socketio_client

    # Test with invalid event data
    invalid_data = {'invalid_field': 'test'}
    client.emit('test_event', invalid_data)

    # Should receive validation error
    verify_event_received(
        client,
        'error',
        {'message': 'Invalid event data'}
    )

def test_universe_room_management(universe_with_connected_clients):
    """Test joining and leaving universe rooms."""
    universe, clients = universe_with_connected_clients
    client1, client2, _ = clients

    # Join universe room
    room_name = f'universe_{universe.id}'
    client1.emit('join_universe', {'universe_id': universe.id})

    # Verify join confirmation
    verify_event_received(
        client1,
        'universe_joined',
        {'universe_id': universe.id}
    )

    # Send universe message
    message = {'content': 'Universe update'}
    client1.emit('universe_message', {
        'universe_id': universe.id,
        'message': message
    })

    # Only clients in universe room should receive it
    verify_event_received(
        client1,
        'universe_message',
        {'universe_id': universe.id, 'message': message}
    )
    verify_event_not_received(client2, 'universe_message')

    # Leave universe room
    client1.emit('leave_universe', {'universe_id': universe.id})
    verify_event_received(
        client1,
        'universe_left',
        {'universe_id': universe.id}
    )

    # Should no longer receive universe messages
    client2.emit('universe_message', {
        'universe_id': universe.id,
        'message': {'content': 'Another update'}
    })
    verify_event_not_received(client1, 'universe_message')

def test_universe_updates(universe_with_connected_clients):
    """Test universe state updates."""
    universe, clients = universe_with_connected_clients
    client1, client2, _ = clients

    # Both clients join universe
    for client in [client1, client2]:
        client.emit('join_universe', {'universe_id': universe.id})
        verify_event_received(
            client,
            'universe_joined',
            {'universe_id': universe.id}
        )

    # Client 1 updates universe state
    update = {
        'universe_id': universe.id,
        'state': {'new_value': 42}
    }
    client1.emit('update_universe', update)

    # Both clients should receive update
    for client in [client1, client2]:
        verify_event_received(
            client,
            'universe_updated',
            update
        )

def test_universe_error_handling(universe_with_connected_clients):
    """Test error handling for universe operations."""
    universe, clients = universe_with_connected_clients
    client = clients[0]

    # Try to join non-existent universe
    client.emit('join_universe', {'universe_id': 999})
    verify_event_received(
        client,
        'error',
        {'message': 'Universe not found'}
    )

    # Try to send message to universe without joining
    client.emit('universe_message', {
        'universe_id': universe.id,
        'message': {'content': 'test'}
    })
    verify_event_received(
        client,
        'error',
        {'message': 'Not in universe room'}
    )

    # Try to update universe without permission
    client.emit('update_universe', {
        'universe_id': universe.id,
        'state': {'value': 1}
    })
    verify_event_received(
        client,
        'error',
        {'message': 'Permission denied'}
    )

def test_universe_concurrent_updates(universe_with_connected_clients):
    """Test handling of concurrent universe updates."""
    universe, clients = universe_with_connected_clients
    client1, client2, _ = clients

    # Both clients join universe
    for client in [client1, client2]:
        client.emit('join_universe', {'universe_id': universe.id})

    # Send concurrent updates
    update1 = {
        'universe_id': universe.id,
        'state': {'value': 1},
        'timestamp': datetime.now().timestamp()
    }
    update2 = {
        'universe_id': universe.id,
        'state': {'value': 2},
        'timestamp': datetime.now().timestamp() + 1  # Later timestamp
    }

    client1.emit('update_universe', update1)
    client2.emit('update_universe', update2)

    # Both clients should receive the later update
    for client in [client1, client2]:
        verify_event_received(
            client,
            'universe_updated',
            update2
        )
        # Earlier update should be rejected
        verify_event_received(
            client,
            'update_rejected',
            {'update': update1, 'reason': 'Outdated timestamp'}
        )

def test_cursor_movement(universe_with_connected_clients):
    """Test cursor movement updates between clients."""
    universe, clients = universe_with_connected_clients
    client1, client2, _ = clients

    # Both clients join universe
    for client in [client1, client2]:
        client.emit('join_universe', {'universe_id': universe.id})
        verify_event_received(
            client,
            'universe_joined',
            {'universe_id': universe.id}
        )

    # Client 1 moves cursor
    cursor_pos = {'x': 100, 'y': 200}
    client1.emit('cursor_move', {
        'universe_id': universe.id,
        'position': cursor_pos
    })

    # Client 2 should receive cursor update
    verify_event_received(
        client2,
        'cursor_moved',
        {
            'universe_id': universe.id,
            'user_id': client1.user_id,
            'position': cursor_pos
        }
    )

    # Client 1 should not receive their own cursor update
    verify_event_not_received(client1, 'cursor_moved')

def test_collaborative_editing(universe_with_connected_clients):
    """Test collaborative editing features."""
    universe, clients = universe_with_connected_clients
    client1, client2, _ = clients

    # Both clients join universe
    for client in [client1, client2]:
        client.emit('join_universe', {'universe_id': universe.id})

    # Client 1 makes an edit
    edit1 = {
        'universe_id': universe.id,
        'operation': 'insert',
        'position': {'x': 0, 'y': 0},
        'content': 'Hello',
        'version': 1
    }
    client1.emit('edit', edit1)

    # Client 2 should receive the edit
    verify_event_received(
        client2,
        'edit_applied',
        {
            'universe_id': universe.id,
            'user_id': client1.user_id,
            'edit': edit1
        }
    )

    # Client 2 makes a concurrent edit
    edit2 = {
        'universe_id': universe.id,
        'operation': 'insert',
        'position': {'x': 5, 'y': 0},
        'content': ' World',
        'version': 2
    }
    client2.emit('edit', edit2)

    # Client 1 should receive the edit
    verify_event_received(
        client1,
        'edit_applied',
        {
            'universe_id': universe.id,
            'user_id': client2.user_id,
            'edit': edit2
        }
    )

def test_selection_sync(universe_with_connected_clients):
    """Test synchronization of text selections."""
    universe, clients = universe_with_connected_clients
    client1, client2, _ = clients

    # Both clients join universe
    for client in [client1, client2]:
        client.emit('join_universe', {'universe_id': universe.id})

    # Client 1 makes a selection
    selection = {
        'universe_id': universe.id,
        'start': {'x': 0, 'y': 0},
        'end': {'x': 5, 'y': 0}
    }
    client1.emit('selection_change', selection)

    # Client 2 should receive selection update
    verify_event_received(
        client2,
        'selection_changed',
        {
            'universe_id': universe.id,
            'user_id': client1.user_id,
            'selection': selection
        }
    )

    # Client 1 clears selection
    client1.emit('selection_change', {
        'universe_id': universe.id,
        'start': None,
        'end': None
    })

    # Client 2 should receive selection clear
    verify_event_received(
        client2,
        'selection_changed',
        {
            'universe_id': universe.id,
            'user_id': client1.user_id,
            'selection': None
        }
    )

def test_presence_tracking(universe_with_connected_clients):
    """Test user presence tracking in universe."""
    universe, clients = universe_with_connected_clients
    client1, client2, client3 = clients

    # Client 1 joins universe
    client1.emit('join_universe', {'universe_id': universe.id})

    # Client 2 joins and should see client 1
    client2.emit('join_universe', {'universe_id': universe.id})
    verify_event_received(
        client2,
        'presence_update',
        {
            'universe_id': universe.id,
            'users': [
                {
                    'user_id': client1.user_id,
                    'status': 'active'
                }
            ]
        }
    )

    # Client 1 should be notified of client 2 joining
    verify_event_received(
        client1,
        'presence_update',
        {
            'universe_id': universe.id,
            'users': [
                {
                    'user_id': client2.user_id,
                    'status': 'active'
                }
            ]
        }
    )

    # Client 1 goes idle
    client1.emit('status_change', {
        'universe_id': universe.id,
        'status': 'idle'
    })

    # Client 2 should see status change
    verify_event_received(
        client2,
        'presence_update',
        {
            'universe_id': universe.id,
            'users': [
                {
                    'user_id': client1.user_id,
                    'status': 'idle'
                }
            ]
        }
    )

    # Client 1 disconnects
    client1.disconnect()

    # Client 2 should see client 1 removed
    verify_event_received(
        client2,
        'presence_update',
        {
            'universe_id': universe.id,
            'users': [
                {
                    'user_id': client1.user_id,
                    'status': 'offline'
                }
            ]
        }
    )

def test_simulation_control(universe_with_connected_clients):
    """Test simulation start/stop broadcasting."""
    universe, clients = universe_with_connected_clients
    client1, client2, _ = clients

    # Both clients join universe
    for client in [client1, client2]:
        client.emit('join_universe', {'universe_id': universe.id})

    # Client 1 starts simulation
    client1.emit('start_simulation', {
        'universe_id': universe.id,
        'config': {
            'speed': 1.0,
            'time_step': 0.01
        }
    })

    # Both clients should receive simulation started event
    for client in [client1, client2]:
        verify_event_received(
            client,
            'simulation_started',
            {
                'universe_id': universe.id,
                'config': {
                    'speed': 1.0,
                    'time_step': 0.01
                }
            }
        )

    # Client 2 pauses simulation
    client2.emit('pause_simulation', {
        'universe_id': universe.id
    })

    # Both clients should receive pause event
    for client in [client1, client2]:
        verify_event_received(
            client,
            'simulation_paused',
            {'universe_id': universe.id}
        )

    # Client 1 stops simulation
    client1.emit('stop_simulation', {
        'universe_id': universe.id
    })

    # Both clients should receive stop event
    for client in [client1, client2]:
        verify_event_received(
            client,
            'simulation_stopped',
            {'universe_id': universe.id}
        )

def test_simulation_state_sync(universe_with_connected_clients):
    """Test simulation state synchronization."""
    universe, clients = universe_with_connected_clients
    client1, client2, _ = clients

    # Both clients join universe
    for client in [client1, client2]:
        client.emit('join_universe', {'universe_id': universe.id})

    # Start simulation
    client1.emit('start_simulation', {
        'universe_id': universe.id,
        'config': {'speed': 1.0}
    })

    # Simulate state updates
    state_update = {
        'universe_id': universe.id,
        'timestamp': time.time(),
        'bodies': [
            {
                'id': 1,
                'position': {'x': 0, 'y': 0},
                'velocity': {'x': 1, 'y': 0}
            }
        ]
    }
    client1.emit('simulation_update', state_update)

    # All clients should receive state update
    for client in [client1, client2]:
        verify_event_received(
            client,
            'simulation_state_updated',
            state_update
        )

def test_simulation_error_handling(universe_with_connected_clients):
    """Test error handling in simulation control."""
    universe, clients = universe_with_connected_clients
    client = clients[0]

    # Try to start simulation without joining universe
    client.emit('start_simulation', {
        'universe_id': universe.id
    })
    verify_event_received(
        client,
        'error',
        {'message': 'Not in universe room'}
    )

    # Join universe
    client.emit('join_universe', {'universe_id': universe.id})

    # Try to start with invalid config
    client.emit('start_simulation', {
        'universe_id': universe.id,
        'config': {'invalid': True}
    })
    verify_event_received(
        client,
        'error',
        {'message': 'Invalid simulation configuration'}
    )

    # Try to pause non-running simulation
    client.emit('pause_simulation', {
        'universe_id': universe.id
    })
    verify_event_received(
        client,
        'error',
        {'message': 'Simulation not running'}
    )

def test_simulation_permissions(universe_with_connected_clients):
    """Test simulation control permissions."""
    universe, clients = universe_with_connected_clients
    client1, client2, _ = clients

    # Both clients join universe
    for client in [client1, client2]:
        client.emit('join_universe', {'universe_id': universe.id})

    # Set client1 as owner
    client1.emit('set_owner', {
        'universe_id': universe.id,
        'user_id': client1.user_id
    })

    # Client2 tries to start simulation without permission
    client2.emit('start_simulation', {
        'universe_id': universe.id,
        'config': {'speed': 1.0}
    })
    verify_event_received(
        client2,
        'error',
        {'message': 'Permission denied'}
    )

    # Owner (client1) starts simulation
    client1.emit('start_simulation', {
        'universe_id': universe.id,
        'config': {'speed': 1.0}
    })

    # Both clients should receive start event
    for client in [client1, client2]:
        verify_event_received(
            client,
            'simulation_started',
            {
                'universe_id': universe.id,
                'config': {'speed': 1.0}
            }
        )

def test_parameter_updates(universe_with_connected_clients):
    """Test updating simulation parameters."""
    universe, clients = universe_with_connected_clients
    client1, client2, _ = clients

    # Both clients join universe
    for client in [client1, client2]:
        client.emit('join_universe', {'universe_id': universe.id})

    # Start simulation
    client1.emit('start_simulation', {
        'universe_id': universe.id,
        'config': {'speed': 1.0}
    })

    # Update simulation speed
    client1.emit('update_parameters', {
        'universe_id': universe.id,
        'parameters': {
            'speed': 2.0,
            'time_step': 0.005
        }
    })

    # Both clients should receive parameter update
    for client in [client1, client2]:
        verify_event_received(
            client,
            'parameters_updated',
            {
                'universe_id': universe.id,
                'parameters': {
                    'speed': 2.0,
                    'time_step': 0.005
                }
            }
        )

    # Try invalid parameter update
    client1.emit('update_parameters', {
        'universe_id': universe.id,
        'parameters': {
            'speed': -1.0  # Invalid negative speed
        }
    })
    verify_event_received(
        client1,
        'error',
        {'message': 'Invalid parameter value'}
    )

def test_performance_monitoring(universe_with_connected_clients):
    """Test performance monitoring events."""
    universe, clients = universe_with_connected_clients
    client1, client2, _ = clients

    # Both clients join universe
    for client in [client1, client2]:
        client.emit('join_universe', {'universe_id': universe.id})

    # Start simulation
    client1.emit('start_simulation', {
        'universe_id': universe.id,
        'config': {'speed': 1.0}
    })

    # Client 1 reports performance metrics
    metrics = {
        'universe_id': universe.id,
        'fps': 60,
        'frame_time': 16.67,
        'cpu_usage': 0.5,
        'memory_usage': 1024
    }
    client1.emit('performance_report', metrics)

    # Server should aggregate and broadcast metrics
    for client in [client1, client2]:
        verify_event_received(
            client,
            'performance_update',
            {
                'universe_id': universe.id,
                'metrics': {
                    'average_fps': 60,
                    'average_frame_time': 16.67,
                    'client_count': 1,
                    'total_memory_usage': 1024
                }
            }
        )

    # Client 2 reports different metrics
    metrics2 = {
        'universe_id': universe.id,
        'fps': 30,
        'frame_time': 33.33,
        'cpu_usage': 0.8,
        'memory_usage': 2048
    }
    client2.emit('performance_report', metrics2)

    # Server should update aggregated metrics
    for client in [client1, client2]:
        verify_event_received(
            client,
            'performance_update',
            {
                'universe_id': universe.id,
                'metrics': {
                    'average_fps': 45,  # (60 + 30) / 2
                    'average_frame_time': 25,  # (16.67 + 33.33) / 2
                    'client_count': 2,
                    'total_memory_usage': 3072  # 1024 + 2048
                }
            }
        )

def test_performance_thresholds(universe_with_connected_clients):
    """Test performance threshold warnings."""
    universe, clients = universe_with_connected_clients
    client = clients[0]

    # Join universe
    client.emit('join_universe', {'universe_id': universe.id})

    # Start simulation
    client.emit('start_simulation', {
        'universe_id': universe.id,
        'config': {'speed': 1.0}
    })

    # Report poor performance
    client.emit('performance_report', {
        'universe_id': universe.id,
        'fps': 15,  # Below threshold
        'frame_time': 66.67,
        'cpu_usage': 0.9,  # High CPU usage
        'memory_usage': 4096
    })

    # Should receive performance warning
    verify_event_received(
        client,
        'performance_warning',
        {
            'universe_id': universe.id,
            'warning': 'Low FPS detected',
            'current_fps': 15,
            'threshold': 30
        }
    )

    # Report improved performance
    client.emit('performance_report', {
        'universe_id': universe.id,
        'fps': 60,
        'frame_time': 16.67,
        'cpu_usage': 0.5,
        'memory_usage': 2048
    })

    # Should receive performance recovery notification
    verify_event_received(
        client,
        'performance_update',
        {
            'universe_id': universe.id,
            'status': 'normal',
            'message': 'Performance returned to normal'
        }
    )

def test_auto_performance_adjustment(universe_with_connected_clients):
    """Test automatic performance adjustments."""
    universe, clients = universe_with_connected_clients
    client = clients[0]

    # Join universe and start simulation
    client.emit('join_universe', {'universe_id': universe.id})
    client.emit('start_simulation', {
        'universe_id': universe.id,
        'config': {
            'speed': 1.0,
            'quality': 'high'
        }
    })

    # Report sustained poor performance
    for _ in range(3):  # Multiple reports to trigger adjustment
        client.emit('performance_report', {
            'universe_id': universe.id,
            'fps': 20,
            'frame_time': 50,
            'cpu_usage': 0.85,
            'memory_usage': 3072
        })

    # Should receive auto-adjustment notification
    verify_event_received(
        client,
        'quality_adjusted',
        {
            'universe_id': universe.id,
            'new_quality': 'medium',
            'reason': 'Maintaining target FPS'
        }
    )

    # Verify simulation parameters were updated
    verify_event_received(
        client,
        'parameters_updated',
        {
            'universe_id': universe.id,
            'parameters': {
                'quality': 'medium',
                'particle_count': 1000,  # Reduced from high quality
                'effect_quality': 0.5
            }
        }
    )

def test_error_handling(auth_socketio_client):
    """Test error handling for various scenarios."""
    client = auth_socketio_client

    # Test invalid event name
    client.emit('invalid_event', {'data': 'test'})
    verify_event_received(
        client,
        'error',
        {'message': 'Unknown event type'}
    )

    # Test missing required data
    client.emit('join_universe', {})  # Missing universe_id
    verify_event_received(
        client,
        'error',
        {'message': 'Missing required field: universe_id'}
    )

    # Test invalid data type
    client.emit('join_universe', {
        'universe_id': 'not_a_number'  # Should be integer
    })
    verify_event_received(
        client,
        'error',
        {'message': 'Invalid data type for field: universe_id'}
    )

    # Test rate limiting
    for _ in range(10):  # Exceed rate limit
        client.emit('cursor_move', {
            'universe_id': 1,
            'position': {'x': 0, 'y': 0}
        })
    verify_event_received(
        client,
        'error',
        {'message': 'Rate limit exceeded'}
    )

def test_connection_cleanup(universe_with_connected_clients):
    """Test proper cleanup after client disconnection."""
    universe, clients = universe_with_connected_clients
    client1, client2, _ = clients

    # Both clients join universe
    for client in [client1, client2]:
        client.emit('join_universe', {'universe_id': universe.id})

    # Store client1's session ID
    client1_sid = client1.eio_sid

    # Client1 disconnects abruptly
    client1.disconnect()

    # Client2 should receive leave notification
    verify_event_received(
        client2,
        'client_left',
        {
            'universe_id': universe.id,
            'client_sid': client1_sid
        }
    )

    # Verify client1 was removed from room
    client2.emit('get_clients', {'universe_id': universe.id})
    verify_event_received(
        client2,
        'client_list',
        {
            'universe_id': universe.id,
            'clients': [client2.eio_sid]  # Only client2 should remain
        }
    )

def test_reconnection_handling(universe_with_connected_clients):
    """Test handling of client reconnection."""
    universe, clients = universe_with_connected_clients
    client = clients[0]

    # Join universe and store state
    client.emit('join_universe', {'universe_id': universe.id})
    original_sid = client.eio_sid

    # Simulate temporary disconnect
    client.disconnect()
    time.sleep(0.1)  # Brief delay
    client.connect()

    # Verify new session created
    assert client.eio_sid != original_sid

    # Try to rejoin universe
    client.emit('join_universe', {'universe_id': universe.id})

    # Should receive current universe state
    verify_event_received(
        client,
        'universe_state',
        {
            'universe_id': universe.id,
            'clients': [],  # List of connected clients
            'simulation_running': False,
            'parameters': {
                'speed': 1.0,
                'time_step': 0.01
            }
        }
    )

def test_cleanup_on_universe_deletion(universe_with_connected_clients):
    """Test cleanup when universe is deleted."""
    universe, clients = universe_with_connected_clients
    client1, client2, _ = clients

    # Both clients join universe
    for client in [client1, client2]:
        client.emit('join_universe', {'universe_id': universe.id})

    # Delete universe
    client1.emit('delete_universe', {'universe_id': universe.id})

    # All clients should be notified
    for client in [client1, client2]:
        verify_event_received(
            client,
            'universe_deleted',
            {'universe_id': universe.id}
        )

        # Verify clients were removed from room
        verify_event_received(
            client,
            'left_universe',
            {'universe_id': universe.id}
        )

    # Verify universe no longer accessible
    client1.emit('join_universe', {'universe_id': universe.id})
    verify_event_received(
        client1,
        'error',
        {'message': 'Universe not found'}
    )

@pytest.fixture(scope='module')
def test_client():
    app = create_app('testing')
    return app.test_client()

@pytest.fixture(scope='module')
def test_app():
    app = create_app('testing')
    return app

@pytest.fixture(scope='module')
def socketio_test_client(test_app):
    socketio = SocketIO(test_app, message_queue=None)
    test_client = socketio.test_client(test_app)
    return test_client

@pytest.fixture(scope='function')
def authenticated_socket_client(test_app, test_client):
    """Create an authenticated socket client."""
    with test_app.app_context():
        # Create test user
        user = User(
            username='testuser',
            email='test@example.com'
        )
        user.set_password('testpass123')
        db.session.add(user)
        db.session.commit()

        # Login to get token
        response = test_client.post('/api/auth/login', json={
            'email': 'test@example.com',
            'password': 'testpass123'
        })
        token = json.loads(response.data)['access_token']

        # Create socket client with auth
        socketio = SocketIO(test_app, message_queue=None)
        socket_client = socketio.test_client(
            test_app,
            auth={'token': token}
        )

        yield socket_client

        # Cleanup
        db.session.delete(user)
        db.session.commit()

def test_unauthorized_connection(socketio_test_client):
    """Test that unauthorized clients can't connect."""
    assert not socketio_test_client.is_connected()

def test_authorized_connection(authenticated_socket_client):
    """Test that authorized clients can connect."""
    assert authenticated_socket_client.is_connected()

def test_universe_creation(authenticated_socket_client, test_app):
    """Test universe creation via WebSocket."""
    with test_app.app_context():
        # Emit universe creation event
        authenticated_socket_client.emit('create_universe', {
            'name': 'Test Universe',
            'description': 'A test universe'
        })

        # Wait for response
        response = authenticated_socket_client.get_received()
        assert len(response) > 0
        assert response[0]['name'] == 'universe_created'

        # Verify universe was created in database
        universe = Universe.query.filter_by(name='Test Universe').first()
        assert universe is not None
        assert universe.description == 'A test universe'

        # Cleanup
        db.session.delete(universe)
        db.session.commit()

def test_universe_update(authenticated_socket_client, test_app):
    """Test universe update via WebSocket."""
    with test_app.app_context():
        # Create test universe
        universe = Universe(
            name='Original Universe',
            description='Original description'
        )
        db.session.add(universe)
        db.session.commit()

        # Emit update event
        authenticated_socket_client.emit('update_universe', {
            'id': universe.id,
            'name': 'Updated Universe',
            'description': 'Updated description'
        })

        # Wait for response
        response = authenticated_socket_client.get_received()
        assert len(response) > 0
        assert response[0]['name'] == 'universe_updated'

        # Verify update in database
        updated = Universe.query.get(universe.id)
        assert updated.name == 'Updated Universe'
        assert updated.description == 'Updated description'

        # Cleanup
        db.session.delete(universe)
        db.session.commit()

def test_connection_maintenance(authenticated_socket_client):
    """Test that connection is maintained and ping/pong works."""
    # Initial connection check
    assert authenticated_socket_client.is_connected()

    # Wait for a ping interval
    time.sleep(2)

    # Should still be connected after ping/pong
    assert authenticated_socket_client.is_connected()

def test_error_handling(authenticated_socket_client):
    """Test error handling in WebSocket events."""
    # Send invalid data
    authenticated_socket_client.emit('create_universe', {
        'invalid': 'data'
    })

    # Should receive error event
    response = authenticated_socket_client.get_received()
    assert len(response) > 0
    assert response[0]['name'] == 'error'
    assert 'message' in response[0]['args'][0]

def test_disconnection(authenticated_socket_client):
    """Test client disconnection handling."""
    assert authenticated_socket_client.is_connected()
    authenticated_socket_client.disconnect()
    assert not authenticated_socket_client.is_connected()
