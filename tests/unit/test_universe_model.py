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
        user_id=test_user.id,
        is_public=False,
        allow_guests=False,
        music_parameters={},
        visual_parameters={}
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
    result = test_universe.to_dict()

    # Debug output
    print(f"test_universe.id: {test_universe.id} (type: {type(test_universe.id)})")
    print(f"result['id']: {result['id']} (type: {type(result['id'])})")
    print(f"test_universe.user_id: {test_universe.user_id} (type: {type(test_universe.user_id)})")
    print(f"result['user_id']: {result['user_id']} (type: {type(result['user_id'])})")

    # Assertions
    assert result["name"] == "Test Universe"
    assert result["description"] == "Test Description"
    assert result["user_id"] == str(test_universe.user_id)
    assert result["id"] == str(test_universe.id)
    assert result["is_public"] is False
    assert result["allow_guests"] is False
    assert isinstance(result["created_at"], str)
    assert isinstance(result["updated_at"], str)
    assert isinstance(result["music_parameters"], dict)
    assert isinstance(result["visual_parameters"], dict)
    assert result["collaborators_count"] == 0

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

def test_can_user_access(session, test_universe, test_user):
    """Test universe access control."""
    # Create another user
    other_user = User(username="other", email="other@test.com")
    other_user.set_password("password")
    session.add(other_user)
    session.commit()

    # Test private universe access
    test_universe.is_public = False
    session.commit()

    # Owner should have access
    assert test_universe.can_user_access(str(test_user.id)) is True

    # Other user should not have access
    assert test_universe.can_user_access(str(other_user.id)) is False

    # Test public universe access
    test_universe.is_public = True
    session.commit()

    # Both users should have access to public universe
    assert test_universe.can_user_access(str(test_user.id)) is True
    assert test_universe.can_user_access(str(other_user.id)) is True

    # Test collaborator access
    test_universe.is_public = False
    test_universe.collaborators.append(other_user)
    session.commit()

    # Collaborator should have access to private universe
    assert test_universe.can_user_access(str(other_user.id)) is True

def test_can_user_edit(session, test_universe, test_user):
    """Test universe edit permissions."""
    # Create another user
    other_user = User(username="other", email="other@test.com")
    other_user.set_password("password")
    session.add(other_user)
    session.commit()

    # Only owner should be able to edit
    assert test_universe.can_user_edit(str(test_user.id)) is True
    assert test_universe.can_user_edit(str(other_user.id)) is False

    # Even collaborators cannot edit
    test_universe.collaborators.append(other_user)
    session.commit()
    assert test_universe.can_user_edit(str(other_user.id)) is False

def test_can_user_manage_collaborators(session, test_universe, test_user):
    """Test collaborator management permissions."""
    # Create another user
    other_user = User(username="other", email="other@test.com")
    other_user.set_password("password")
    session.add(other_user)
    session.commit()

    # Only owner should be able to manage collaborators
    assert test_universe.can_user_manage_collaborators(str(test_user.id)) is True
    assert test_universe.can_user_manage_collaborators(str(other_user.id)) is False

    # Even collaborators cannot manage other collaborators
    test_universe.collaborators.append(other_user)
    session.commit()
    assert test_universe.can_user_manage_collaborators(str(other_user.id)) is False

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

