"""Tests for Universe model."""
import pytest
from datetime import datetime
from app.models.universe import Universe
from app.models.user import User
from app.extensions import db
from sqlalchemy.exc import IntegrityError

@pytest.fixture
def test_user(session):
    """Create a test user."""
    user = User(username='testuser', email='test@example.com')
    session.add(user)
    session.commit()
    return user

@pytest.fixture
def test_universe(test_user, session):
    """Create a test universe."""
    universe = Universe(
        name='Test Universe',
        description='Test Description',
        user_id=test_user.id
    )
    session.add(universe)
    session.commit()
    return universe

def test_new_universe(session, test_user):
    """Test creating a new universe"""
    universe = Universe(
        name="Test Universe",
        description="A test universe",
        user_id=test_user.id,
        is_public=True
    )
    session.add(universe)
    session.commit()

    assert universe.name == "Test Universe"
    assert universe.description == "A test universe"
    assert universe.user_id == test_user.id
    assert universe.is_public is True
    assert universe.user == test_user
    assert universe in test_user.owned_universes

def test_universe_to_dict(session, test_universe):
    """Test converting a universe to dictionary"""
    universe_dict = test_universe.to_dict()

    assert universe_dict["name"] == "Test Universe"
    assert universe_dict["description"] == "A test universe"
    assert universe_dict["user_id"] == test_universe.user_id
    assert universe_dict["is_public"] is True

def test_universe_relationships(session, test_user, test_universe):
    """Test universe relationships"""
    # Test user relationship
    assert test_universe.user == test_user
    assert test_universe in test_user.owned_universes

    # Test cascade delete
    session.delete(test_user)
    session.commit()

    # Universe should be deleted when user is deleted
    assert session.query(Universe).filter_by(id=test_universe.id).first() is None

def test_universe_access_control(session, test_user):
    """Test universe access control"""
    # Create a private universe
    private_universe = Universe(
        name="Private Universe",
        description="A private universe",
        user_id=test_user.id,
        is_public=False
    )
    session.add(private_universe)
    session.commit()

    # Create another user
    other_user = User(
        username="otheruser",
        email="other@example.com",
        password="password123"
    )
    session.add(other_user)
    session.commit()

    # Test access control
    assert private_universe.can_user_access(test_user.id) is True  # Owner can access
    assert private_universe.can_user_access(other_user.id) is False  # Other user cannot access

    # Make universe public
    private_universe.is_public = True
    session.commit()

    # Now other user should be able to access
    assert private_universe.can_user_access(other_user.id) is True

    # Test edit permissions
    assert private_universe.can_user_edit(test_user.id) is True  # Owner can edit
    assert private_universe.can_user_edit(other_user.id) is False  # Other user cannot edit

    # Test collaborator management permissions
    assert private_universe.can_manage_collaborators(test_user.id) is True  # Owner can manage
    assert private_universe.can_manage_collaborators(other_user.id) is False  # Other user cannot manage

def test_universe_validation(session, test_user):
    """Test universe validation constraints"""
    # Test missing required fields
    with pytest.raises(IntegrityError):
        universe = Universe(description="Missing name")
        session.add(universe)
        session.commit()
    session.rollback()

    # Test duplicate name for same user
    universe1 = Universe(
        name="Same Name",
        description="First universe",
        user_id=test_user.id
    )
    session.add(universe1)
    session.commit()

    with pytest.raises(IntegrityError):
        universe2 = Universe(
            name="Same Name",
            description="Second universe",
            user_id=test_user.id
        )
        session.add(universe2)
        session.commit()
    session.rollback()

