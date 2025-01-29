import pytest
from flask import json

def test_register(client):
    """Test user registration."""
    response = client.post('/api/auth/register', json={
        'username': 'newuser',
        'email': 'new@example.com',
        'password': 'password123'
    })
    assert response.status_code == 201
    data = json.loads(response.data)
    assert 'message' in data
    assert 'user' in data
    assert data['user']['username'] == 'newuser'
    assert data['user']['email'] == 'new@example.com'

def test_login(client, test_user):
    """Test user login."""
    response = client.post('/api/auth/login', json={
        'username': 'testuser',
        'password': 'password123'
    })
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'access_token' in data
    assert 'user' in data
    assert data['user']['username'] == 'testuser'

def test_login_invalid_credentials(client):
    """Test login with invalid credentials."""
    response = client.post('/api/auth/login', json={
        'username': 'wronguser',
        'password': 'wrongpass'
    })
    assert response.status_code == 401
    data = json.loads(response.data)
    assert 'message' in data

def test_logout(client, auth_headers):
    """Test user logout."""
    response = client.post('/api/auth/logout', headers=auth_headers)
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'message' in data

def test_refresh_token(client, auth_headers):
    """Test token refresh."""
    response = client.post('/api/auth/refresh', headers=auth_headers)
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'access_token' in data
