import json
import pytest
from app.models import User

def test_signup(client, session):
    """Test user signup."""
    data = {
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'testpass123'
    }
    response = client.post('/api/auth/signup',
                          data=json.dumps(data),
                          content_type='application/json')
    assert response.status_code == 201
    assert b'User created successfully' in response.data

    user = session.query(User).filter_by(username='testuser').first()
    assert user is not None
    assert user.email == 'test@example.com'

def test_login(client, session):
    """Test user login."""
    # Create a test user
    user = User(username='testuser', email='test@example.com')
    user.set_password('testpass123')
    session.add(user)
    session.commit()

    data = {
        'email': 'test@example.com',
        'password': 'testpass123'
    }
    response = client.post('/api/auth/login',
                          data=json.dumps(data),
                          content_type='application/json')
    assert response.status_code == 200

    response_data = json.loads(response.data)
    assert 'token' in response_data
    assert 'user' in response_data
    assert response_data['user']['email'] == 'test@example.com'

def test_validate_token(client, auth_headers):
    """Test token validation."""
    response = client.get('/api/auth/validate',
                         headers=auth_headers)
    assert response.status_code == 200

def test_invalid_login(client):
    """Test login with invalid credentials."""
    data = {
        'email': 'wrong@example.com',
        'password': 'wrongpass'
    }
    response = client.post('/api/auth/login',
                          data=json.dumps(data),
                          content_type='application/json')
    assert response.status_code == 401

def test_duplicate_signup(client, session):
    """Test signup with existing username."""
    # Create initial user
    user = User(username='testuser', email='test@example.com')
    user.set_password('testpass123')
    session.add(user)
    session.commit()

    # Try to create duplicate user
    data = {
        'username': 'testuser',
        'email': 'another@example.com',
        'password': 'testpass123'
    }
    response = client.post('/api/auth/signup',
                          data=json.dumps(data),
                          content_type='application/json')
    assert response.status_code == 400
    assert b'Username already exists' in response.data
