"""Unit tests for authentication functionality."""
import pytest
from flask import json
from app.models import User, Universe
from app.utils.auth import check_universe_access
from app.utils.security import hash_password, verify_password
from flask_jwt_extended import create_access_token
from ...config import TestConfig

def test_user_registration(client, session):
    """Test user registration."""
    response = client.post('/api/auth/register', json={
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'Password123'
    })
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['status'] == 'success'
    assert 'token' in data['data']
    assert 'user' in data['data']

    # Verify user was created in database
    user = session.query(User).filter_by(email='test@example.com').first()
    assert user is not None
    assert user.username == 'testuser'

def test_registration_validation(client, session):
    """Test registration validation."""
    # Create a user directly in the database
    user = User(username='testuser', email='test@example.com')
    user.set_password('Password123')
    session.add(user)
    session.commit()

    # Try to register with same email
    response = client.post('/api/auth/register', json={
        'username': 'testuser2',
        'email': 'test@example.com',
        'password': 'Password123'
    })
    assert response.status_code == 400
    data = json.loads(response.data)
    assert data['status'] == 'error'
    assert 'email already registered' in data['message'].lower()

def test_user_login(client, session):
    """Test user login."""
    # Create a user
    user = User(username='testuser', email='test@example.com')
    user.set_password('Password123')
    session.add(user)
    session.commit()

    # Try to login
    response = client.post('/api/auth/login', json={
        'email': 'test@example.com',
        'password': 'Password123'
    })
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['status'] == 'success'
    assert 'token' in data['data']
    assert 'user' in data['data']

def test_invalid_login(client, session):
    """Test invalid login credentials."""
    response = client.post('/api/auth/login', json={
        'email': 'wrong@example.com',
        'password': 'wrongpass'
    })
    assert response.status_code == 401
    data = json.loads(response.data)
    assert data['status'] == 'error'
    assert 'invalid' in data['message'].lower()

def test_token_validation(client, auth_headers):
    """Test protected route with valid token."""
    response = client.get('/api/auth/protected', headers=auth_headers)
    assert response.status_code == 200

def test_invalid_token(client):
    """Test protected route with invalid token."""
    headers = {
        'Authorization': 'Bearer invalid_token',
        'Content-Type': 'application/json'
    }
    response = client.get('/api/auth/protected', headers=headers)
    assert response.status_code == 401

def test_user_creation(session):
    """Test user model creation."""
    user = User(
        username='testuser',
        email='test@example.com',
        password='Password123'
    )
    session.add(user)
    session.commit()

    assert user.id is not None
    assert user.username == 'testuser'
    assert user.email == 'test@example.com'
    assert user.verify_password('Password123')

def test_password_hashing():
    """Test password hashing and verification."""
    password = 'Password123'
    hashed = hash_password(password)

    assert hashed != password
    assert verify_password(password, hashed)
    assert not verify_password('wrongpassword', hashed)

def test_universe_access(session):
    """Test universe access checking."""
    user = User(username='creator', email='creator@test.com', password='Password123')
    other_user = User(username='other', email='other@test.com', password='Password123')
    session.add_all([user, other_user])
    session.commit()

    # Public universe
    public_universe = Universe(
        name='Public Universe',
        user_id=user.id,
        is_public=True
    )
    session.add(public_universe)

    # Private universe
    private_universe = Universe(
        name='Private Universe',
        user_id=user.id,
        is_public=False
    )
    session.add(private_universe)
    session.commit()

    # Test public universe access
    assert check_universe_access(public_universe, other_user.id)
    assert check_universe_access(public_universe, user.id)

    # Test private universe access
    assert not check_universe_access(private_universe, other_user.id)
    assert check_universe_access(private_universe, user.id)

    # Test ownership requirement
    assert not check_universe_access(public_universe, other_user.id, require_ownership=True)
    assert check_universe_access(public_universe, user.id, require_ownership=True)

def test_jwt_token(app, session):
    """Test JWT token creation and usage."""
    with app.test_request_context():
        # Create a real user for the token
        user = User(username='testuser', email='test@example.com', password='Password123')
        session.add(user)
        session.commit()

        token = create_access_token(identity=user.id)
        assert token is not None
        assert isinstance(token, str)
