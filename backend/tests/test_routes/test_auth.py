"""Tests for authentication routes."""
import pytest
from flask import url_for
from app.models.user import User
from app.models.profile import Profile

def test_register(client, app):
    """Test user registration."""
    data = {
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'testpass123',
        'bio': 'Test bio',
        'preferences': {'theme': 'dark'}
    }

    response = client.post('/api/auth/register', json=data)
    assert response.status_code == 201
    assert 'access_token' in response.json
    assert response.json['username'] == data['username']
    assert response.json['email'] == data['email']
    assert 'profile' in response.json
    assert response.json['profile']['bio'] == data['bio']

def test_register_duplicate_username(client, user):
    """Test registration with duplicate username."""
    data = {
        'username': user.username,
        'email': 'new@example.com',
        'password': 'testpass123'
    }

    response = client.post('/api/auth/register', json=data)
    assert response.status_code == 400
    assert 'error' in response.json
    assert 'Username already exists' in response.json['error']

def test_login(client, user):
    """Test user login."""
    data = {
        'email': user.email,
        'password': 'password123'  # Set in conftest.py
    }

    response = client.post('/api/auth/login', json=data)
    assert response.status_code == 200
    assert 'access_token' in response.json
    assert response.json['username'] == user.username
    assert response.json['email'] == user.email

def test_login_invalid_credentials(client, user):
    """Test login with invalid credentials."""
    data = {
        'email': user.email,
        'password': 'wrongpass'
    }

    response = client.post('/api/auth/login', json=data)
    assert response.status_code == 401
    assert 'error' in response.json

def test_get_current_user(client, auth_headers, user):
    """Test getting current user details."""
    response = client.get('/api/auth/user', headers=auth_headers)
    assert response.status_code == 200
    assert response.json['username'] == user.username
    assert response.json['email'] == user.email

def test_update_user(client, auth_headers, user):
    """Test updating user details."""
    data = {
        'username': 'newusername',
        'bio': 'Updated bio',
        'preferences': {'theme': 'light'}
    }

    response = client.put('/api/auth/me', json=data, headers=auth_headers)
    assert response.status_code == 200
    assert response.json['username'] == data['username']
    assert 'profile' in response.json
    assert response.json['profile']['bio'] == data['bio']
    assert response.json['profile']['preferences'] == data['preferences']

def test_delete_user(client, auth_headers, user):
    """Test deleting user account."""
    response = client.delete('/api/auth/me', headers=auth_headers)
    assert response.status_code == 204

    # Verify user is deleted
    assert User.query.get(user.id) is None

def test_deactivate_activate_account(client, auth_headers, user):
    """Test account deactivation and activation."""
    # Test deactivation
    response = client.post('/api/auth/me/deactivate', headers=auth_headers)
    assert response.status_code == 200
    assert 'Account deactivated' in response.json['message']

    # Verify login fails when deactivated
    login_data = {
        'email': user.email,
        'password': 'password123'
    }
    response = client.post('/api/auth/login', json=login_data)
    assert response.status_code == 401

    # Test activation
    response = client.post('/api/auth/me/activate', headers=auth_headers)
    assert response.status_code == 200
    assert 'Account activated' in response.json['message']

    # Verify login works after activation
    response = client.post('/api/auth/login', json=login_data)
    assert response.status_code == 200
