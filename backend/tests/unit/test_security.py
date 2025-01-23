import pytest
from flask_jwt_extended import create_access_token
from app.models.base import User, Universe
from app.utils.helpers.auth import check_universe_access, require_auth
from app.utils.helpers.security import hash_password, verify_password

def test_password_hashing():
    """Test password hashing and verification"""
    password = "test123"
    hashed = hash_password(password)
    assert verify_password(password, hashed)
    assert not verify_password("wrong", hashed)

def test_jwt_token_creation():
    """Test JWT token creation and validation"""
    user_id = 1
    token = create_access_token(user_id)
    assert token is not None
    assert isinstance(token, str)

def test_require_auth_decorator(client):
    """Test require_auth decorator"""
    # Use a real protected route that exists
    response = client.get('/api/universes/1')
    assert response.status_code == 401
    assert 'Missing Authorization Header' in response.get_json()['msg']

def test_check_universe_access(session):
    """Test universe access checking"""
    user = User(email='test@example.com', password='testpass123')
    session.add(user)
    session.commit()

    # Test owner access
    universe = Universe(
        title='Test Universe',
        description='Test Description',
        is_public=False,
        user_id=user.id
    )
    session.add(universe)
    session.commit()

    # Test public access
    public_universe = Universe(
        title='Public Universe',
        description='Public Description',
        is_public=True,
        user_id=user.id
    )
    session.add(public_universe)
    session.commit()

def test_rate_limiting(client):
    """Test rate limiting functionality"""
    # Test endpoint with rate limiting
    for _ in range(31):  # Rate limit is 30 per hour
        response = client.post('/api/auth/login',
                             json={'email': 'test@example.com', 'password': 'wrong'})

    # Should be rate limited now
    response = client.post('/api/auth/login',
                          json={'email': 'test@example.com', 'password': 'wrong'})
    assert response.status_code == 429
    response_data = response.get_json()
    assert response_data is not None
    assert 'error' in response_data
    assert 'Too Many Requests' in response_data['error']
