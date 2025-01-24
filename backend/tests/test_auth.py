"""Authentication tests."""
import pytest
from app.models import User

def test_register(client):
    """Test user registration."""
    response = client.post('/api/auth/register', json={
        'username': 'newuser',
        'email': 'new@example.com',
        'password': 'password123'
    })
    assert response.status_code == 201
    assert 'token' in response.json
    assert 'user' in response.json

def test_register_duplicate_email(client, test_user):
    """Test registration with duplicate email."""
    response = client.post('/api/auth/register', json={
        'username': 'another',
        'email': 'test@example.com',
        'password': 'password123'
    })
    assert response.status_code == 400
    assert 'error' in response.json

def test_login(client, test_user):
    """Test user login."""
    response = client.post('/api/auth/login', json={
        'email': 'test@example.com',
        'password': 'password123'
    })
    assert response.status_code == 200
    assert 'token' in response.json
    assert 'user' in response.json

def test_login_invalid_credentials(client):
    """Test login with invalid credentials."""
    response = client.post('/api/auth/login', json={
        'email': 'wrong@example.com',
        'password': 'wrongpass'
    })
    assert response.status_code == 401
    assert 'error' in response.json

def test_get_current_user(client, auth_headers):
    """Test getting current user info."""
    response = client.get('/api/auth/me', headers=auth_headers)
    assert response.status_code == 200
    assert 'id' in response.json
    assert 'email' in response.json

def test_refresh_token(client, auth_headers):
    """Test token refresh."""
    response = client.post('/api/auth/refresh', headers=auth_headers)
    assert response.status_code == 200
    assert 'token' in response.json

def test_password_change(client, auth_headers):
    """Test password change."""
    response = client.post('/api/auth/password', json={
        'current_password': 'password123',
        'new_password': 'newpassword123'
    }, headers=auth_headers)
    assert response.status_code == 200

    # Try logging in with new password
    response = client.post('/api/auth/login', json={
        'email': 'test@example.com',
        'password': 'newpassword123'
    })
    assert response.status_code == 200

def test_logout(client, auth_headers):
    """Test user logout."""
    response = client.post('/api/auth/logout', headers=auth_headers)
    assert response.status_code == 200

    # Try accessing protected route after logout
    response = client.get('/api/auth/me', headers=auth_headers)
    assert response.status_code == 401
