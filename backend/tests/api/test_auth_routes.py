"""Tests for authentication routes."""
import json
import pytest
from app.models import User
from app.extensions import db
from datetime import datetime

def test_register(client):
    """Test user registration."""
    response = client.post('/api/auth/register', json={
        'username': 'test',
        'email': 'test@example.com',
        'password': 'password'
    })
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['username'] == 'test'
    assert 'id' in data

def test_login(client, auth):
    """Test user login."""
    auth.register()
    response = auth.login()
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['username'] == 'test'
    assert 'token' in data

def test_logout(client, auth):
    """Test user logout."""
    auth.register()
    auth.login()
    response = auth.logout()
    assert response.status_code == 200

def test_invalid_registration(client):
    """Test invalid registration attempts."""
    # Test missing fields
    response = client.post('/api/auth/register', json={
        'username': 'test'
    })
    assert response.status_code == 400

    # Test duplicate username
    client.post('/api/auth/register', json={
        'username': 'test',
        'email': 'test@example.com',
        'password': 'password'
    })
    response = client.post('/api/auth/register', json={
        'username': 'test',
        'email': 'other@example.com',
        'password': 'password'
    })
    assert response.status_code == 400

    # Test duplicate email
    response = client.post('/api/auth/register', json={
        'username': 'other',
        'email': 'test@example.com',
        'password': 'password'
    })
    assert response.status_code == 400

def test_invalid_login(client, auth):
    """Test invalid login attempts."""
    auth.register()

    # Test wrong password
    response = client.post('/api/auth/login', json={
        'username': 'test',
        'password': 'wrong'
    })
    assert response.status_code == 401

    # Test non-existent user
    response = client.post('/api/auth/login', json={
        'username': 'nonexistent',
        'password': 'password'
    })
    assert response.status_code == 401

def test_protected_route(client, auth):
    """Test accessing protected route."""
    # Try accessing without login
    response = client.get('/api/users/me')
    assert response.status_code == 401

    # Login and try again
    auth.register()
    auth.login()
    response = client.get('/api/users/me')
    assert response.status_code == 200

def test_token_expiration(client, auth):
    """Test token expiration."""
    auth.register()
    auth.login()

    # Simulate token expiration
    user = User.query.filter_by(username='test').first()
    user.token_expiration = datetime.utcnow()
    db.session.commit()

    response = client.get('/api/users/me')
    assert response.status_code == 401
