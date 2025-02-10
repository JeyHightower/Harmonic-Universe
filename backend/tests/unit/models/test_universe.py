import pytest
from app.models import Universe, User
from app.models.db import db

def test_universe_creation():
    """Test basic universe creation"""
    universe = Universe(
        name='Test Universe',
        description='A test universe description',
        creator_id=1
    )
    assert universe.name == 'Test Universe'
    assert universe.description == 'A test universe description'
    assert universe.creator_id == 1

def test_universe_validation():
    """Test universe model validation"""
    with pytest.raises(ValueError):
        Universe(
            name='',  # Empty name should raise error
            description='Test description',
            creator_id=1
        )

def test_universe_relationships():
    """Test universe relationships with other models"""
    user = User(
        username='test_user',
        email='test@example.com'
    )
    universe = Universe(
        name='Test Universe',
        description='A test universe description',
        creator=user
    )
    assert universe.creator == user
    assert hasattr(universe, 'scenes')
    assert hasattr(universe, 'storyboards')
