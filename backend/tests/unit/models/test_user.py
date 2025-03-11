import pytest
from app.models import User
from app.models.db import db

def test_user_creation():
    """Test basic user creation"""
    user = User(
        username='test_user',
        email='test@example.com'
    )
    assert user.username == 'test_user'
    assert user.email == 'test@example.com'

def test_user_validation():
    """Test user model validation"""
    with pytest.raises(ValueError):
        User(
            username='',  # Empty username should raise error
            email='test@example.com'
        )

def test_user_relationships():
    """Test user relationships with other models"""
    user = User(
        username='test_user',
        email='test@example.com'
    )
    # Add relationship tests here
    assert hasattr(user, 'universes')
    assert hasattr(user, 'storyboards')
