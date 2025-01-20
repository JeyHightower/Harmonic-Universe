import json
import pytest
from flask_jwt_extended import create_access_token
from app.models import User
import unittest
from app import create_app
from app.extensions import db
from tests.test_utils import BaseTest

@pytest.fixture
def auth_headers(session):
    """Create a test user and return auth headers with valid token."""
    user = User(email='test@example.com', password='testpass123')
    session.add(user)
    session.commit()

    token = create_access_token(identity=user.id)
    return {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }

def test_signup(client, session):
    """Test user signup."""
    data = {
        'email': 'test@example.com',
        'password': 'testpass123'
    }
    response = client.post('/api/auth/register',
                          data=json.dumps(data),
                          content_type='application/json')
    assert response.status_code == 201

    response_data = json.loads(response.data)
    assert response_data['status'] == 'success'
    assert 'token' in response_data['data']
    assert 'user' in response_data['data']
    assert response_data['data']['user']['email'] == 'test@example.com'

    user = session.query(User).filter_by(email='test@example.com').first()
    assert user is not None

def test_login(client, session):
    """Test user login."""
    # Create a test user with a new email
    user = User(email='test2@example.com', password='testpass123')
    session.add(user)
    session.commit()

    response = client.post('/api/auth/login',
                          json={'email': 'test2@example.com', 'password': 'testpass123'})
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'token' in data['data']

def test_validate_token(client, auth_headers):
    """Test token validation."""
    response = client.get('/api/auth/validate',
                         headers=auth_headers)
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['status'] == 'success'
    assert 'user' in data['data']

def test_invalid_login(client):
    """Test login with invalid credentials."""
    response = client.post('/api/auth/login',
                          json={'email': 'wrong@example.com', 'password': 'wrongpass'})
    assert response.status_code == 401

def test_duplicate_signup(client, session):
    """Test signup with existing email."""
    # Create initial user with a new email
    user = User(email='test3@example.com', password='testpass123')
    session.add(user)
    session.commit()

    # Try to register with same email
    response = client.post('/api/auth/register',
                          json={'email': 'test3@example.com', 'password': 'testpass123'})
    assert response.status_code == 409

class TestAuthFlow(BaseTest):
    def test_auth_flow(self):
        # Test registration
        response = self.register_user()
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        self.assertIn('data', data)
        self.assertIn('token', data['data'])

        # Test login
        response = self.login_user()
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('data', data)
        self.assertIn('token', data['data'])

if __name__ == '__main__':
    unittest.main()
