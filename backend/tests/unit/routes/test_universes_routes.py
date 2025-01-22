import pytest
from flask import json
from app import create_app
from config import Config

class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    JWT_SECRET_KEY = 'test-secret-key'

@pytest.fixture
def app():
    app = create_app(TestConfig)
    return app

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def auth_headers(client):
    # Register and login to get token
    client.post('/api/auth/register', json={
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'password123'
    })
    response = client.post('/api/auth/login', json={
        'email': 'test@example.com',
        'password': 'password123'
    })
    token = json.loads(response.data)['token']
    return {'Authorization': f'Bearer {token}'}

def test_create_universe(client, auth_headers):
    response = client.post('/api/universes', json={
        'name': 'Test Universe',
        'description': 'A test universe',
        'settings': {
            'gravity': 9.81,
            'timeScale': 1.0
        }
    }, headers=auth_headers)
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['name'] == 'Test Universe'
    assert 'id' in data

def test_get_universes(client, auth_headers):
    # Create a universe first
    client.post('/api/universes', json={
        'name': 'Test Universe',
        'description': 'A test universe',
        'settings': {
            'gravity': 9.81,
            'timeScale': 1.0
        }
    }, headers=auth_headers)

    response = client.get('/api/universes', headers=auth_headers)
    assert response.status_code == 200
    data = json.loads(response.data)
    assert len(data) > 0
    assert data[0]['name'] == 'Test Universe'

def test_get_universe(client, auth_headers):
    # Create a universe first
    create_response = client.post('/api/universes', json={
        'name': 'Test Universe',
        'description': 'A test universe',
        'settings': {
            'gravity': 9.81,
            'timeScale': 1.0
        }
    }, headers=auth_headers)
    universe_id = json.loads(create_response.data)['id']

    response = client.get(f'/api/universes/{universe_id}', headers=auth_headers)
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['name'] == 'Test Universe'
    assert data['id'] == universe_id

def test_update_universe(client, auth_headers):
    # Create a universe first
    create_response = client.post('/api/universes', json={
        'name': 'Test Universe',
        'description': 'A test universe',
        'settings': {
            'gravity': 9.81,
            'timeScale': 1.0
        }
    }, headers=auth_headers)
    universe_id = json.loads(create_response.data)['id']

    response = client.put(f'/api/universes/{universe_id}', json={
        'name': 'Updated Universe',
        'description': 'An updated universe',
        'settings': {
            'gravity': 10.0,
            'timeScale': 2.0
        }
    }, headers=auth_headers)
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['name'] == 'Updated Universe'
    assert data['settings']['gravity'] == 10.0

def test_delete_universe(client, auth_headers):
    # Create a universe first
    create_response = client.post('/api/universes', json={
        'name': 'Test Universe',
        'description': 'A test universe',
        'settings': {
            'gravity': 9.81,
            'timeScale': 1.0
        }
    }, headers=auth_headers)
    universe_id = json.loads(create_response.data)['id']

    response = client.delete(f'/api/universes/{universe_id}', headers=auth_headers)
    assert response.status_code == 204

    # Verify it's deleted
    get_response = client.get(f'/api/universes/{universe_id}', headers=auth_headers)
    assert get_response.status_code == 404

def test_create_universe_no_auth(client):
    response = client.post('/api/universes', json={
        'name': 'Test Universe',
        'description': 'A test universe',
        'settings': {
            'gravity': 9.81,
            'timeScale': 1.0
        }
    })
    assert response.status_code == 401

def test_create_universe_invalid_data(client, auth_headers):
    response = client.post('/api/universes', json={
        'name': '',  # Invalid empty name
        'description': 'A test universe',
        'settings': {
            'gravity': 9.81,
            'timeScale': 1.0
        }
    }, headers=auth_headers)
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data
