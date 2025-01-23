import pytest
from flask import json
from app import create_app
from ...config import TestConfig

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
    data = json.loads(response.data)
    token = data['data']['token']
    return {'Authorization': f'Bearer {token}'}

def test_get_preferences(client, auth_headers):
    response = client.get('/api/preferences', headers=auth_headers)
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'theme' in data
    assert 'language' in data
    assert 'emailNotifications' in data

def test_update_preferences(client, auth_headers):
    new_preferences = {
        'theme': 'dark',
        'language': 'es',
        'emailNotifications': True
    }
    response = client.put('/api/preferences',
                         json=new_preferences,
                         headers=auth_headers)
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['theme'] == 'dark'
    assert data['language'] == 'es'
    assert data['emailNotifications'] == True

def test_get_preferences_no_auth(client):
    response = client.get('/api/preferences')
    assert response.status_code == 401

def test_update_preferences_no_auth(client):
    response = client.put('/api/preferences', json={
        'theme': 'dark',
        'language': 'es',
        'emailNotifications': True
    })
    assert response.status_code == 401

def test_update_preferences_invalid_theme(client, auth_headers):
    response = client.put('/api/preferences', json={
        'theme': 'invalid_theme',
        'language': 'es',
        'emailNotifications': True
    }, headers=auth_headers)
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data

def test_update_preferences_invalid_language(client, auth_headers):
    response = client.put('/api/preferences', json={
        'theme': 'dark',
        'language': 'invalid_lang',
        'emailNotifications': True
    }, headers=auth_headers)
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data
