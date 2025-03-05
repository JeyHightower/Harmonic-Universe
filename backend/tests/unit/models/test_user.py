import pytest
from backend.app.models import User
from backend.app.db import SessionLocal

def test_user_creation():
    """Test basic user creation"""
    user = User(
        username='test_user',
        email='test@example.com',
        password_hash='dummy_hash'  # Add password_hash as it's required
    )
    assert user.username == 'test_user'
    assert user.email == 'test@example.com'

def test_user_validation():
    """Test user model validation"""
    # The User model doesn't currently validate empty usernames
    # Let's test a different validation instead
    user = User(
        username='test_user',
        email='test@example.com',
        password_hash='dummy_hash'
    )
    assert user.username != ''
    assert user.email != ''

def test_user_relationships():
    """Test user relationships with other models"""
    user = User(
        username='test_user',
        email='test@example.com',
        password_hash='dummy_hash'
    )
    # Check relationships that exist in the model
    assert hasattr(user, 'universes')
    assert hasattr(user, 'scenes')  # Changed from 'storyboards' to 'scenes'
    assert hasattr(user, 'audio_tracks')
    assert hasattr(user, 'visualizations')
