"""Tests for Universe model."""
import pytest
from datetime import datetime, timezone
from app.models import Universe, User
from app.extensions import db

def test_new_universe(session):
    """Test creating a new universe."""
    # Create and save user
    user = User(username="testuser", email="test@example.com")
    session.add(user)
    session.commit()

    # Create and save universe
    universe = Universe(
        name="Test Universe",
        description="Test Description",
        user_id=user.id
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
        visual_parameters=visual_params
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

    universe = Universe(
        name="Test Universe",
        user_id=user.id
    )
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
