import pytest
import json
from app.models.user import User
from app.models.universe import Universe
from app import db

class TestUniverseFlow:
    def test_complete_universe_flow(self, client, auth_headers, test_user, socketio_client):
        """Test complete flow of universe creation and collaboration"""
        # Step 1: Create a new universe
        create_response = client.post('/api/universes', json={
            'name': 'Flow Test Universe',
            'description': 'Testing complete flow',
            'is_public': True,
            'physics_parameters': {
                'gravity': 9.81,
                'time_dilation': 1.0
            }
        }, headers=auth_headers)
        assert create_response.status_code == 201
        universe_data = json.loads(create_response.data)
        universe_id = universe_data['id']

        # Step 2: Create a collaborator
        collab_response = client.post('/api/auth/register', json={
            'username': 'collaborator',
            'email': 'collab@example.com',
            'password': 'password123'
        })
        assert collab_response.status_code == 201
        collab_data = json.loads(collab_response.data)
        collab_email = collab_data['email']

        # Step 3: Add collaborator to universe
        add_collab_response = client.post(
            f'/api/universes/{universe_id}/collaborators',
            json={'email': collab_email},
            headers=auth_headers
        )
        assert add_collab_response.status_code == 201

        # Step 4: Join universe room
        socketio_client.emit('join', {'universe_id': universe_id}, namespace='/test')
        received = socketio_client.get_received(namespace='/test')
        assert any(event.get('name') == 'join_response' for event in received)
        join_event = next(event for event in received if event.get('name') == 'join_response')
        assert join_event['args'][0]['status'] == 'success'

        # Step 5: Update universe parameters
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
        assert any(event.get('name') == 'parameters_updated' for event in received)

        # Step 6: Verify universe state
        get_response = client.get(f'/api/universes/{universe_id}', headers=auth_headers)
        assert get_response.status_code == 200
        universe_state = json.loads(get_response.data)
        assert universe_state['physics_parameters']['gravity'] == 5.0

        # Step 7: Test collaborator access
        # Login as collaborator
        collab_login_response = client.post('/api/auth/login', json={
            'email': collab_email,
            'password': 'password123'
        })
        assert collab_login_response.status_code == 200
        collab_token = json.loads(collab_login_response.data)['access_token']
        collab_headers = {'Authorization': f'Bearer {collab_token}'}

        # Verify collaborator can access universe
        collab_get_response = client.get(f'/api/universes/{universe_id}', headers=collab_headers)
        assert collab_get_response.status_code == 200

        # Step 8: Test universe update permissions
        collab_update_response = client.put(
            f'/api/universes/{universe_id}',
            json={'name': 'Updated by Collaborator'},
            headers=collab_headers
        )
        assert collab_update_response.status_code == 200

    def test_universe_access_control(self, client, auth_headers):
        """Test universe access control and permissions"""
        # Create a private universe
        create_response = client.post('/api/universes', json={
            'name': 'Private Universe',
            'description': 'Testing access control',
            'is_public': False
        }, headers=auth_headers)
        assert create_response.status_code == 201
        universe_id = json.loads(create_response.data)['id']

        # Create another user
        other_response = client.post('/api/auth/register', json={
            'username': 'other_user',
            'email': 'other@example.com',
            'password': 'password123'
        })
        assert other_response.status_code == 201

        # Login as other user
        login_response = client.post('/api/auth/login', json={
            'email': 'other@example.com',
            'password': 'password123'
        })
        other_token = json.loads(login_response.data)['access_token']
        other_headers = {'Authorization': f'Bearer {other_token}'}

        # Verify other user cannot access private universe
        other_get_response = client.get(f'/api/universes/{universe_id}', headers=other_headers)
        assert other_get_response.status_code == 403

    def test_concurrent_updates(self, client, auth_headers, test_user, socketio_client):
        """Test handling of concurrent universe updates"""
        # Create universe
        create_response = client.post('/api/universes', json={
            'name': 'Concurrent Test',
            'description': 'Testing concurrent updates',
            'is_public': True
        }, headers=auth_headers)
        universe_id = json.loads(create_response.data)['id']

        # Join universe room
        socketio_client.emit('join', {'universe_id': universe_id}, namespace='/test')
        socketio_client.get_received(namespace='/test')  # Clear events

        # Simulate concurrent updates
        update_data_1 = {
            'universe_id': universe_id,
            'parameters': {
                'physics': {'gravity': 5.0}
            }
        }
        update_data_2 = {
            'universe_id': universe_id,
            'parameters': {
                'physics': {'gravity': 6.0}
            }
        }

        # Send updates in quick succession
        socketio_client.emit('parameter_update', update_data_1, namespace='/test')
        socketio_client.emit('parameter_update', update_data_2, namespace='/test')

        # Verify final state
        received = socketio_client.get_received(namespace='/test')
        updates = [event for event in received if event.get('name') == 'parameters_updated']
        assert len(updates) == 2
        final_update = updates[-1]
        assert final_update['args'][0]['parameters']['physics']['gravity'] == 6.0
