import pytest
from app.models.user import User
from app.models.profile import Profile
from app import db
from flask_jwt_extended import decode_token
import json

class TestAuthentication:
    def test_user_registration(self, client):
        """Test user registration process"""
        response = client.post('/api/auth/register', json={
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'password123'
        })
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['username'] == 'testuser'
        assert data['email'] == 'test@example.com'
        assert 'id' in data

    def test_duplicate_registration(self, client, test_user):
        """Test registration with duplicate email"""
        response = client.post('/api/auth/register', json={
            'username': 'another_user',
            'email': test_user.email,
            'password': 'password123'
        })
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data

    def test_user_login(self, client, test_user):
        """Test user login process"""
        response = client.post('/api/auth/login', json={
            'email': test_user.email,
            'password': 'password123'
        })
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'access_token' in data

        # Verify token contents
        token = data['access_token']
        decoded = decode_token(token)
        assert decoded['sub'] == test_user.id

    def test_invalid_login(self, client):
        """Test login with invalid credentials"""
        response = client.post('/api/auth/login', json={
            'email': 'nonexistent@example.com',
            'password': 'wrongpassword'
        })
        assert response.status_code == 401

    def test_password_validation(self, client):
        """Test password validation rules"""
        # Test too short password
        response = client.post('/api/auth/register', json={
            'username': 'shortpass',
            'email': 'short@example.com',
            'password': 'short'
        })
        assert response.status_code == 400

        # Test valid password
        response = client.post('/api/auth/register', json={
            'username': 'validpass',
            'email': 'valid@example.com',
            'password': 'ValidPassword123!'
        })
        assert response.status_code == 201

class TestUserProfile:
    def test_profile_creation(self, app, test_user):
        """Test user profile creation"""
        with app.app_context():
            profile = Profile(
                user_id=test_user.id,
                bio="Test bio",
                avatar_url="http://example.com/avatar.jpg"
            )
            db.session.add(profile)
            db.session.commit()

            assert profile.id is not None
            assert profile.user_id == test_user.id
            assert profile.bio == "Test bio"

    def test_profile_update(self, client, auth_headers):
        """Test profile update through API"""
        response = client.put('/api/profile', json={
            'bio': 'Updated bio',
            'avatar_url': 'http://example.com/new_avatar.jpg'
        }, headers=auth_headers)
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['bio'] == 'Updated bio'

    def test_profile_validation(self, app, test_user):
        """Test profile validation rules"""
        with app.app_context():
            # Test bio length validation
            long_bio = "a" * 1001  # Exceeds max length
            profile = Profile(
                user_id=test_user.id,
                bio=long_bio
            )
            with pytest.raises(Exception):
                db.session.add(profile)
                db.session.commit()
            db.session.rollback()

class TestUserManagement:
    def test_user_deletion(self, app, test_user):
        """Test user account deletion"""
        with app.app_context():
            user_id = test_user.id
            db.session.delete(test_user)
            db.session.commit()

            assert User.query.get(user_id) is None

    def test_password_change(self, client, auth_headers, test_user):
        """Test password change functionality"""
        response = client.post('/api/auth/change-password', json={
            'current_password': 'password123',
            'new_password': 'newpassword123'
        }, headers=auth_headers)
        assert response.status_code == 200

        # Try logging in with new password
        response = client.post('/api/auth/login', json={
            'email': test_user.email,
            'password': 'newpassword123'
        })
        assert response.status_code == 200
        assert 'access_token' in json.loads(response.data)

    def test_user_search(self, client, auth_headers, test_user):
        """Test user search functionality"""
        response = client.get(f'/api/users/search?q={test_user.username[:3]}',
                            headers=auth_headers)
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data) > 0
        assert any(user['username'] == test_user.username for user in data)
