import pytest
from app.models import db
from app.models.universe import Universe
from app.models.physics_parameters import PhysicsParameters

@pytest.fixture
def auth_headers(app, test_user):
    with app.app_context():
        from app.models import db
        db.session.add(test_user)
        db.session.commit()
        token = test_user.generate_auth_token()
        db.session.remove()
        return {'Authorization': f'Bearer {token}'}

class TestAuthentication:
    def test_register(self, client):
        response = client.post('/api/auth/register', json={
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'password123'
        })
        assert response.status_code == 201

    def test_login(self, client):
        # Register first
        client.post('/api/auth/register', json={
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'password123'
        })

        # Then login
        response = client.post('/api/auth/login', json={
            'username': 'testuser',
            'password': 'password123'
        })
        assert response.status_code == 200
        assert 'token' in response.json

    def test_profile_management(self, client, auth_headers):
        # Create profile
        response = client.post('/api/profile', headers=auth_headers, json={
            'bio': 'Test bio',
            'preferences': {'theme': 'dark'}
        })
        assert response.status_code == 201

class TestUniverse:
    def test_universe_crud(self, client, auth_headers):
        # Create universe
        response = client.post('/api/universe', headers=auth_headers, json={
            'name': 'Test Universe',
            'description': 'A test universe',
            'physics_parameters': {
                'gravity': 9.81,
                'time_dilation': 1.0
            }
        })
        assert response.status_code == 201
        data = response.get_json()
        assert 'id' in data
        universe_id = data['id']

        # Get universe
        response = client.get(f'/api/universe/{universe_id}', headers=auth_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert data['name'] == 'Test Universe'
        assert data['physics_parameters']['gravity'] == 9.81

        # Update universe
        response = client.put(f'/api/universe/{universe_id}', json={
            'name': 'Updated Universe',
            'physics_parameters': {
                'gravity': 8.0,
                'time_dilation': 2.0
            }
        }, headers=auth_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert data['name'] == 'Updated Universe'
        assert data['physics_parameters']['gravity'] == 8.0

        # Delete universe
        response = client.delete(f'/api/universe/{universe_id}', headers=auth_headers)
        assert response.status_code == 204

class TestCollaboration:
    def test_collaboration_features(self, client, auth_headers, test_user, socket_client):
        # Create collaborator user first
        client.post('/api/auth/register', json={
            'username': 'collaborator',
            'email': 'collaborator@example.com',
            'password': 'password123'
        })

        # Create universe
        response = client.post('/api/universe', headers=auth_headers, json={
            'name': 'Collab Universe',
            'description': 'A collaborative universe'
        })
        assert response.status_code == 201
        universe_id = response.json['id']

        # Add collaborator
        response = client.post(f'/api/universe/{universe_id}/collaborators',
            headers=auth_headers, json={
                'email': 'collaborator@example.com',
                'role': 'editor'
            })
        assert response.status_code == 201

        # Join universe room
        socket_client.connect()
        assert socket_client.is_connected()
        socket_client.emit('join', {'universe_id': universe_id}, auth=auth_headers)
        received = socket_client.get_received()
        assert any(msg['name'] == 'user_joined' for msg in received)

class TestIntegration:
    def test_full_workflow(self, client, auth_headers, socket_client):
        # 1. Register and login
        client.post('/api/auth/register', json={
            'username': 'integrationuser',
            'email': 'integration@example.com',
            'password': 'password123'
        })
        login_response = client.post('/api/auth/login', json={
            'username': 'integrationuser',
            'password': 'password123'
        })
        token = login_response.json['token']
        headers = {'Authorization': f'Bearer {token}'}

        # 2. Create and update profile
        client.post('/api/profile', headers=headers, json={
            'bio': 'Integration test bio',
            'preferences': {'theme': 'dark'}
        })

        # 3. Create universe
        universe_response = client.post('/api/universe', headers=headers, json={
            'name': 'Integration Universe',
            'description': 'Testing full workflow',
            'physics_parameters': {
                'gravity': 9.81,
                'time_dilation': 1.0
            }
        })
        assert universe_response.status_code == 201
        universe_id = universe_response.json['id']

        # 4. Add collaborator and test real-time features
        client.post(f'/api/universe/{universe_id}/collaborators',
            headers=headers, json={
                'email': 'collaborator@example.com',
                'role': 'editor'
            })

        socket_client.connect()
        assert socket_client.is_connected()
        socket_client.emit('join', {'universe_id': universe_id}, auth=headers)
        socket_client.get_received()  # Clear any previous messages

        socket_client.emit('parameter_update', {
            'universe_id': universe_id,
            'parameters': {'gravity': 8.81}
        }, auth=headers)
        received = socket_client.get_received()
        assert any(msg['name'] == 'parameters_changed' for msg in received)

        # 5. Verify final state
        universe = client.get(f'/api/universe/{universe_id}', headers=headers).json
        assert universe['name'] == 'Integration Universe'
        assert universe['physics_parameters']['gravity'] == 8.81

class TestUser:
    def test_user_crud(self, client, auth_headers):
        # Get current user
        response = client.get('/api/auth/me', headers=auth_headers)
        assert response.status_code == 200
        user_data = response.get_json()
        assert user_data['username'] == 'testuser'

        # Update user
        response = client.put('/api/auth/me', headers=auth_headers, json={
            'username': 'updated_user'
        })
        assert response.status_code == 200
        user_data = response.get_json()
        assert user_data['username'] == 'updated_user'
