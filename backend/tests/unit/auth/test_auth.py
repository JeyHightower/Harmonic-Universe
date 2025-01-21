import pytest
from app.models import User
from flask_jwt_extended import decode_token

def test_user_registration(client):
    """Test user registration."""
    data = {
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'Test123!',
        'confirm_password': 'Test123!'
    }

    response = client.post('/api/auth/register', json=data)
    assert response.status_code == 201
    assert 'access_token' in response.json
    assert 'user' in response.json
    assert response.json['user']['username'] == 'testuser'

def test_user_login(client, session):
    """Test user login."""
    # Create a test user
    user = User(
        username='testuser',
        email='test@example.com'
    )
    user.set_password('Test123!')
    session.add(user)
    session.commit()

    # Test login
    data = {
        'email': 'test@example.com',
        'password': 'Test123!'
    }

    response = client.post('/api/auth/login', json=data)
    assert response.status_code == 200
    assert 'access_token' in response.json
    assert 'user' in response.json
    assert response.json['user']['email'] == 'test@example.com'

def test_invalid_login(client, session):
    """Test login with invalid credentials."""
    # Create a test user
    user = User(
        username='testuser',
        email='test@example.com'
    )
    user.set_password('Test123!')
    session.add(user)
    session.commit()

    # Test with wrong password
    data = {
        'email': 'test@example.com',
        'password': 'WrongPassword123!'
    }

    response = client.post('/api/auth/login', json=data)
    assert response.status_code == 401
    assert 'error' in response.json

def test_token_validation(client, auth_headers):
    """Test token validation."""
    response = client.get('/api/auth/validate', headers=auth_headers)
    assert response.status_code == 200

def test_password_reset_request(client, session):
    """Test password reset request."""
    # Create a test user
    user = User(
        username='testuser',
        email='test@example.com'
    )
    user.set_password('Test123!')
    session.add(user)
    session.commit()

    data = {
        'email': 'test@example.com'
    }

    response = client.post('/api/auth/reset-password-request', json=data)
    assert response.status_code == 200
    assert 'message' in response.json

def test_password_reset(client, session):
    """Test password reset."""
    # Create a test user with reset token
    user = User(
        username='testuser',
        email='test@example.com'
    )
    user.set_password('Test123!')
    reset_token = user.get_reset_password_token()
    session.add(user)
    session.commit()

    data = {
        'token': reset_token,
        'new_password': 'NewTest123!',
        'confirm_password': 'NewTest123!'
    }

    response = client.post('/api/auth/reset-password', json=data)
    assert response.status_code == 200
    assert 'message' in response.json

    # Verify new password works
    login_data = {
        'email': 'test@example.com',
        'password': 'NewTest123!'
    }
    response = client.post('/api/auth/login', json=login_data)
    assert response.status_code == 200

def test_registration_validation(client):
    """Test registration input validation."""
    test_cases = [
        {
            'data': {
                'username': 'te',  # Too short
                'email': 'test@example.com',
                'password': 'Test123!',
                'confirm_password': 'Test123!'
            },
            'error_field': 'username'
        },
        {
            'data': {
                'username': 'testuser',
                'email': 'invalid-email',  # Invalid email format
                'password': 'Test123!',
                'confirm_password': 'Test123!'
            },
            'error_field': 'email'
        },
        {
            'data': {
                'username': 'testuser',
                'email': 'test@example.com',
                'password': 'short',  # Too short
                'confirm_password': 'short'
            },
            'error_field': 'password'
        },
        {
            'data': {
                'username': 'testuser',
                'email': 'test@example.com',
                'password': 'Test123!',
                'confirm_password': 'Different123!'  # Doesn't match
            },
            'error_field': 'confirm_password'
        }
    ]

    for case in test_cases:
        response = client.post('/api/auth/register', json=case['data'])
        assert response.status_code == 400
        assert case['error_field'] in response.json['errors']

def test_token_expiration(client, auth_headers):
    """Test token expiration handling."""
    # Get current token
    token = auth_headers['Authorization'].split()[1]

    # Decode token to verify expiration
    decoded = decode_token(token)
    assert 'exp' in decoded

    # Test token refresh
    response = client.post('/api/auth/refresh', headers=auth_headers)
    assert response.status_code == 200
    assert 'access_token' in response.json
    assert response.json['access_token'] != token
