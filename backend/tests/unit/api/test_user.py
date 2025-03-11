import pytest
from backend.app.models import User


def test_user_creation():
    """Test basic user creation"""
    user = User(username="testuser", email="test@example.com")
    assert user.username == "testuser"
    assert user.email == "test@example.com"


def test_user_representation():
    """Test string representation of user"""
    user = User(username="testuser", email="test@example.com")
    assert str(user) == "User(testuser)"


def test_user_password():
    """Test password hashing"""
    user = User(username="testuser", email="test@example.com")
    user.set_password("password123")
    assert user.check_password("password123")
    assert not user.check_password("wrongpassword")
