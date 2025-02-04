"""Unit tests for models."""

import pytest
from sqlalchemy.orm import Session
from datetime import datetime
from app.models.core.user import User

def test_new_user():
    """Test User model creation."""
    user = User(
        email="test@example.com",
        full_name="Test User",
        is_active=True,
        is_superuser=False
    )
    user.password = "testpassword"

    assert user.email == "test@example.com"
    assert user.full_name == "Test User"
    assert user.is_active is True
    assert user.is_superuser is False
    assert user.hashed_password is not None
    assert user.hashed_password != "testpassword"
    assert isinstance(user.created_at, datetime)
    assert isinstance(user.updated_at, datetime)

def test_password_hashing():
    """Test password hashing."""
    user = User(email="test@example.com")
    user.password = "testpassword"

    assert user.hashed_password is not None
    assert user.hashed_password != "testpassword"
    assert user.verify_password("testpassword") is True
    assert user.verify_password("wrongpassword") is False

def test_password_readonly():
    """Test password is readonly."""
    user = User(email="test@example.com")

    with pytest.raises(AttributeError):
        _ = user.password

def test_user_token():
    """Test user token generation."""
    user = User(
        id=1,
        email="test@example.com",
        is_superuser=False
    )
    token = user.get_token()

    assert isinstance(token, str)
    assert len(token) > 0

def test_user_representation():
    """Test string representation of user."""
    user = User(email="test@example.com")
    assert str(user) == "<User test@example.com>"
