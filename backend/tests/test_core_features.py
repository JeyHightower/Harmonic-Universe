import pytest
from app import create_app
from app.models import User, Universe, Parameter
from app.extensions import db

@pytest.fixture
def app():
    app = create_app('testing')
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def auth_headers(client):
    # Create test user and get auth token
    response = client.post('/api/auth/register', json={
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'password123'
    })
    token = response.json['token']
    return {'Authorization': f'Bearer {token}'}

class TestUserAuthentication:
    def test_register(self, client):
        response = client.post('/api/auth/register', json={
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'password123'
        })
        assert response.status_code == 201
        assert 'token' in response.json

    def test_login(self, client):
        # Register first
        client.post('/api/auth/register', json={
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'password123'
        })

        # Then login
        response = client.post('/api/auth/login', json={
            'email': 'test@example.com',
            'password': 'password123'
        })
        assert response.status_code == 200
        assert 'token' in response.json

class TestUniverseManagement:
    def test_create_universe(self, client, auth_headers):
        response = client.post('/api/universes', json={
            'name': 'Test Universe',
            'description': 'A test universe',
            'is_public': True
        }, headers=auth_headers)
        assert response.status_code == 201
        assert response.json['name'] == 'Test Universe'

    def test_get_universe(self, client, auth_headers):
        # Create universe first
        create_response = client.post('/api/universes', json={
            'name': 'Test Universe',
            'description': 'A test universe',
            'is_public': True
        }, headers=auth_headers)
        universe_id = create_response.json['id']

        # Then get it
        response = client.get(f'/api/universes/{universe_id}', headers=auth_headers)
        assert response.status_code == 200
        assert response.json['name'] == 'Test Universe'

    def test_update_universe(self, client, auth_headers):
        # Create universe first
        create_response = client.post('/api/universes', json={
            'name': 'Test Universe',
            'description': 'A test universe',
            'is_public': True
        }, headers=auth_headers)
        universe_id = create_response.json['id']

        # Then update it
        response = client.put(f'/api/universes/{universe_id}', json={
            'name': 'Updated Universe',
            'description': 'Updated description'
        }, headers=auth_headers)
        assert response.status_code == 200
        assert response.json['name'] == 'Updated Universe'

class TestParameterManagement:
    def test_update_parameters(self, client, auth_headers):
        # Create universe first
        create_response = client.post('/api/universes', json={
            'name': 'Test Universe',
            'description': 'A test universe',
            'is_public': True
        }, headers=auth_headers)
        universe_id = create_response.json['id']

        # Update parameters
        response = client.put(f'/api/universes/{universe_id}/parameters/physics', json={
            'parameters': {
                'gravity': 9.81,
                'particle_speed': 1.0
            }
        }, headers=auth_headers)
        assert response.status_code == 200
        assert response.json['physics_parameters']['gravity'] == 9.81

class TestPrivacyControls:
    def test_privacy_settings(self, client, auth_headers):
        # Create universe first
        create_response = client.post('/api/universes', json={
            'name': 'Test Universe',
            'description': 'A test universe',
            'is_public': True
        }, headers=auth_headers)
        universe_id = create_response.json['id']

        # Update privacy settings
        response = client.put(f'/api/universes/{universe_id}/privacy', json={
            'is_public': False,
            'allow_guests': False,
            'collaborator_permissions': {
                'canEdit': True,
                'canInvite': False
            }
        }, headers=auth_headers)
        assert response.status_code == 200
        assert not response.json['is_public']

class TestFavorites:
    def test_favorite_management(self, client, auth_headers):
        # Create universe first
        create_response = client.post('/api/universes', json={
            'name': 'Test Universe',
            'description': 'A test universe',
            'is_public': True
        }, headers=auth_headers)
        universe_id = create_response.json['id']

        # Toggle favorite
        response = client.post(f'/api/universes/{universe_id}/favorite', headers=auth_headers)
        assert response.status_code == 200
        assert response.json['isFavorite']

        # Get favorites
        response = client.get('/api/universes?filter=favorites', headers=auth_headers)
        assert response.status_code == 200
        assert len(response.json) == 1

class TestCollaboration:
    def test_share_universe(self, client, auth_headers):
        # Create universe first
        create_response = client.post('/api/universes', json={
            'name': 'Test Universe',
            'description': 'A test universe',
            'is_public': True
        }, headers=auth_headers)
        universe_id = create_response.json['id']

        # Create another user to share with
        client.post('/api/auth/register', json={
            'username': 'collaborator',
            'email': 'collab@example.com',
            'password': 'password123'
        })

        # Share universe
        response = client.post(f'/api/universes/{universe_id}/share', json={
            'email': 'collab@example.com'
        }, headers=auth_headers)
        assert response.status_code == 200
        assert 'collaborators' in response.json
