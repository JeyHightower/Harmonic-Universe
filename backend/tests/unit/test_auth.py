import pytest
from app.models import User
from app.services.auth import AuthService
from werkzeug.security import check_password_hash

@pytest.mark.unit
@pytest.mark.auth
class TestAuthService:
    def test_register_user(self, session):
        auth_service = AuthService()
        user_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'password123'
        }

        user = auth_service.register(user_data)
        assert user.username == user_data['username']
        assert user.email == user_data['email']
        assert check_password_hash(user.password_hash, user_data['password'])

        db_user = session.query(User).filter_by(email=user_data['email']).first()
        assert db_user is not None
        assert db_user.username == user_data['username']

    def test_login_user(self, session):
        auth_service = AuthService()
        user_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'password123'
        }

        # Register user first
        auth_service.register(user_data)

        # Test login
        token = auth_service.login(user_data['email'], user_data['password'])
        assert token is not None

        # Test invalid password
        with pytest.raises(ValueError):
            auth_service.login(user_data['email'], 'wrongpassword')

        # Test invalid email
        with pytest.raises(ValueError):
            auth_service.login('wrong@email.com', user_data['password'])

    def test_validate_token(self, session):
        auth_service = AuthService()
        user_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'password123'
        }

        # Register and login user
        auth_service.register(user_data)
        token = auth_service.login(user_data['email'], user_data['password'])

        # Validate token
        user = auth_service.validate_token(token)
        assert user is not None
        assert user.email == user_data['email']

        # Test invalid token
        with pytest.raises(ValueError):
            auth_service.validate_token('invalid_token')

    def test_change_password(self, session):
        auth_service = AuthService()
        user_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'password123'
        }

        # Register user
        user = auth_service.register(user_data)

        # Change password
        new_password = 'newpassword123'
        auth_service.change_password(user, user_data['password'], new_password)

        # Verify new password works
        token = auth_service.login(user_data['email'], new_password)
        assert token is not None

        # Verify old password doesn't work
        with pytest.raises(ValueError):
            auth_service.login(user_data['email'], user_data['password'])

    def test_delete_account(self, session):
        auth_service = AuthService()
        user_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'password123'
        }

        # Register user
        user = auth_service.register(user_data)

        # Delete account
        auth_service.delete_account(user, user_data['password'])

        # Verify user is deleted
        db_user = session.query(User).filter_by(email=user_data['email']).first()
        assert db_user is None

        # Verify login fails
        with pytest.raises(ValueError):
            auth_service.login(user_data['email'], user_data['password'])
