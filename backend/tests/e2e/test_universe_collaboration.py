import pytest
import json
import time
from flask_socketio import SocketIOTestClient

def test_full_collaboration_flow(app, client, auth_headers, socketio_client):
    """Test the complete flow of universe collaboration."""
    with app.app_context():
        # 1. Create two users (creator and collaborator)
        # Create collaborator
        collab_response = client.post('/api/auth/register', json={
            'username': 'collaborator',
            'email': 'collab@example.com',
            'password': 'password123'
        })
        assert collab_response.status_code == 201
        collab_data = json.loads(collab_response.data)

        # 2. Create universe
        universe_response = client.post('/api/universes', json={
            'name': 'Collaborative Universe',
            'description': 'A universe for testing collaboration',
            'is_public': True,
            'physics_parameters': {
                'gravity': 9.81,
                'time_dilation': 1.0
            }
        }, headers=auth_headers)
        assert universe_response.status_code == 201
        universe_data = json.loads(universe_response.data)
        universe_id = universe_data['id']

        # 3. Add collaborator to universe
        collab_add_response = client.post(
            f'/api/universes/{universe_id}/collaborators',
            json={'email': 'collab@example.com'},
            headers=auth_headers
        )
        assert collab_add_response.status_code == 201

        # 4. Creator joins universe via WebSocket
        socketio_client.emit('join', {'universe_id': universe_id}, namespace='/test')
        received = socketio_client.get_received(namespace='/test')
        join_event = next(e for e in received if e['name'] == 'join_response')
        assert join_event['args'][0]['status'] == 'success'

        # 5. Update universe parameters
        update_data = {
            'universe_id': universe_id,
            'parameters': {
                'physics': {
                    'gravity': 5.0,
                    'time_dilation': 2.0
                }
            }
        }
        socketio_client.emit('parameter_update', update_data, namespace='/test')
        received = socketio_client.get_received(namespace='/test')
        update_event = next(e for e in received if e['name'] == 'parameters_updated')
        assert update_event['args'][0]['parameters']['physics']['gravity'] == 5.0

        # 6. Verify universe state via REST API
        get_response = client.get(f'/api/universes/{universe_id}', headers=auth_headers)
        assert get_response.status_code == 200
        universe_state = json.loads(get_response.data)
        assert universe_state['physics_parameters']['gravity'] == 5.0

        # 7. Test real-time updates
        cursor_data = {
            'universe_id': universe_id,
            'position': {'x': 100, 'y': 200},
            'user_id': universe_state['creator_id']
        }
        socketio_client.emit('cursor_update', cursor_data, namespace='/test')
        received = socketio_client.get_received(namespace='/test')
        cursor_event = next(e for e in received if e['name'] == 'cursor_moved')
        assert cursor_event['args'][0]['position'] == {'x': 100, 'y': 200}

        # 8. Test chat functionality
        chat_message = {
            'universe_id': universe_id,
            'message': 'Hello collaborators!',
            'user_id': universe_state['creator_id']
        }
        socketio_client.emit('chat_message', chat_message, namespace='/test')
        received = socketio_client.get_received(namespace='/test')
        chat_event = next(e for e in received if e['name'] == 'chat_received')
        assert chat_event['args'][0]['message'] == 'Hello collaborators!'

        # 9. Test universe state persistence
        # Make multiple rapid updates
        for i in range(3):
            update_data = {
                'universe_id': universe_id,
                'parameters': {
                    'physics': {
                        'gravity': float(i + 1),
                        'time_dilation': float(i + 1)
                    }
                }
            }
            socketio_client.emit('parameter_update', update_data, namespace='/test')
            time.sleep(0.1)  # Small delay between updates

        # Verify final state
        get_response = client.get(f'/api/universes/{universe_id}', headers=auth_headers)
        final_state = json.loads(get_response.data)
        assert final_state['physics_parameters']['gravity'] == 3.0

        # 10. Test cleanup
        # Leave universe
        socketio_client.emit('leave', {'universe_id': universe_id}, namespace='/test')
        received = socketio_client.get_received(namespace='/test')
        leave_event = next(e for e in received if e['name'] == 'leave_response')
        assert leave_event['args'][0]['status'] == 'success'

        # Remove collaborator
        remove_response = client.delete(
            f'/api/universes/{universe_id}/collaborators/{collab_data["id"]}',
            headers=auth_headers
        )
        assert remove_response.status_code == 204

        # Verify collaborator removal
        get_response = client.get(f'/api/universes/{universe_id}', headers=auth_headers)
        final_state = json.loads(get_response.data)
        assert collab_data['id'] not in [c['id'] for c in final_state['collaborators']]

def test_concurrent_collaboration(app, client, auth_headers, socketio_client):
    """Test concurrent collaboration scenarios."""
    with app.app_context():
        # Create universe
        universe_response = client.post('/api/universes', json={
            'name': 'Concurrent Universe',
            'description': 'Testing concurrent collaboration',
            'is_public': True
        }, headers=auth_headers)
        universe_data = json.loads(universe_response.data)
        universe_id = universe_data['id']

        # Create multiple collaborators
        collaborators = []
        for i in range(3):
            response = client.post('/api/auth/register', json={
                'username': f'collaborator_{i}',
                'email': f'collab_{i}@example.com',
                'password': 'password123'
            })
            collaborators.append(json.loads(response.data))

            # Add as collaborator
            client.post(
                f'/api/universes/{universe_id}/collaborators',
                json={'email': f'collab_{i}@example.com'},
                headers=auth_headers
            )

        # Simulate concurrent parameter updates
        update_data = {
            'universe_id': universe_id,
            'parameters': {
                'physics': {
                    'gravity': 5.0,
                    'time_dilation': 2.0
                }
            }
        }

        # Send multiple updates in quick succession
        for _ in range(5):
            socketio_client.emit('parameter_update', update_data, namespace='/test')
            time.sleep(0.05)  # Small delay to simulate near-concurrent updates

        # Verify final state is consistent
        time.sleep(0.5)  # Wait for all updates to process
        get_response = client.get(f'/api/universes/{universe_id}', headers=auth_headers)
        final_state = json.loads(get_response.data)
        assert final_state['physics_parameters']['gravity'] == 5.0
        assert final_state['physics_parameters']['time_dilation'] == 2.0
