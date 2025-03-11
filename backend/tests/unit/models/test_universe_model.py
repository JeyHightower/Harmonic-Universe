"""Tests for Universe model."""
import pytest
from datetime import datetime, timezone
from app.models import Universe, User
from app.extensions import db
from tests.factories import UniverseFactory, UserFactory


def test_new_universe(session):
    """Test creating a new universe."""
    # Create and save user
    user = User(username="testuser", email="test@example.com")
    session.add(user)
    session.commit()

    # Create and save universe
    universe = Universe(
        name="Test Universe", description="Test Description", user_id=user.id
    )
    session.add(universe)
    session.commit()

    # Test basic attributes
    assert universe.name == "Test Universe"
    assert universe.description == "Test Description"
    assert universe.user_id == user.id
    assert isinstance(universe.created_at, datetime)
    assert isinstance(universe.updated_at, datetime)
    assert universe.collaborators_count == 0


def test_universe_to_dict(session):
    """Test converting universe to dictionary."""
    # Create and save user
    user = User(username="testuser", email="test@example.com")
    session.add(user)
    session.commit()

    music_params = {"tempo": 120}
    visual_params = {"background": "#000000"}
    now = datetime.now(timezone.utc)

    universe = Universe(
        name="Test Universe",
        description="A test universe",
        user_id=user.id,
        music_parameters=music_params,
        visual_parameters=visual_params,
    )
    session.add(universe)
    session.commit()

    result = universe.to_dict()
    assert result["id"] == str(universe.id)
    assert result["name"] == "Test Universe"
    assert result["description"] == "A test universe"
    assert result["user_id"] == str(user.id)
    assert result["music_parameters"] == music_params
    assert result["visual_parameters"] == visual_params
    assert isinstance(result["created_at"], str)
    assert isinstance(result["updated_at"], str)


def test_default_parameters(session):
    """Test default values for music and visual parameters."""
    # Create and save user
    user = User(username="testuser", email="test@example.com")
    session.add(user)
    session.commit()

    universe = Universe(name="Test Universe", user_id=user.id)
    session.add(universe)
    session.commit()

    assert universe.music_parameters == {}
    assert universe.visual_parameters == {}


def test_can_user_access(session, test_user, test_universe):
    """Test universe access control."""
    # Ensure user is attached to session
    session.add(test_user)
    session.add(test_universe)
    session.commit()

    # Test public universe access
    test_universe.is_public = True
    session.add(test_universe)
    session.commit()

    assert test_universe.can_user_access(None)  # Anonymous user
    assert test_universe.can_user_access(test_user.id)  # Authenticated user

    # Test private universe access
    test_universe.is_public = False
    session.add(test_universe)
    session.commit()

    assert not test_universe.can_user_access(None)  # Anonymous user
    assert test_universe.can_user_access(test_user.id)  # Owner
    assert not test_universe.can_user_access(999)  # Other user


def test_create_universe(session):
    """Test creating a new universe."""
    user = UserFactory()
    universe = UniverseFactory(
        name="Test Universe", description="A test universe description", user=user
    )
    session.commit()

    assert universe.id is not None
    assert universe.name == "Test Universe"
    assert universe.description == "A test universe description"
    assert universe.user == user


def test_universe_to_dict(session):
    """Test the to_dict method of Universe model."""
    universe = UniverseFactory()
    session.commit()

    universe_dict = universe.to_dict()
    assert isinstance(universe_dict, dict)
    assert universe_dict["id"] == universe.id
    assert universe_dict["name"] == universe.name
    assert universe_dict["description"] == universe.description
    assert universe_dict["user_id"] == universe.user.id


def test_universe_relationships(session):
    """Test universe relationships with other models."""
    universe = UniverseFactory()
    session.commit()

    # Test user relationship
    assert universe.user is not None
    assert hasattr(universe.user, "id")
    assert hasattr(universe.user, "username")

    # Test storyboards relationship
    assert hasattr(universe, "storyboards")
    assert isinstance(universe.storyboards, list)


def test_universe_cascade_delete(session):
    """Test that deleting a universe cascades to related models."""
    universe = UniverseFactory()
    session.commit()

    # Store IDs for verification
    universe_id = universe.id
    storyboard_ids = [sb.id for sb in universe.storyboards]

    # Delete the universe
    session.delete(universe)
    session.commit()

    # Verify universe is deleted
    assert Universe.query.get(universe_id) is None

    # Verify related storyboards are deleted
    from backend.app.models import Storyboard

    for sb_id in storyboard_ids:
        assert Storyboard.query.get(sb_id) is None


def test_universe_validation(session):
    """Test universe model validation."""
    user = UserFactory()

    # Test name is required
    with pytest.raises(Exception):
        universe = Universe(description="Test", user=user)
        session.add(universe)
        session.commit()

    # Test user is required
    with pytest.raises(Exception):
        universe = Universe(name="Test", description="Test")
        session.add(universe)
        session.commit()


def test_universe_unique_name_per_user(session):
    """Test that universe names must be unique per user."""
    user = UserFactory()
    universe1 = UniverseFactory(name="Same Name", user=user)
    session.commit()

    # Try to create another universe with the same name for the same user
    with pytest.raises(Exception):
        universe2 = UniverseFactory(name="Same Name", user=user)
        session.commit()

    # Should be able to create universe with same name for different user
    other_user = UserFactory()
    universe3 = UniverseFactory(name="Same Name", user=other_user)
    session.commit()  # Should not raise an exception
