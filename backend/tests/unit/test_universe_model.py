"""Tests for Universe model."""
import pytest
from datetime import datetime, timezone
from app.models.universe import Universe
from app.models.user import User
from app.extensions import db

def test_new_universe(app):
    """Test creating a new universe."""
    with app.app_context():
        # Create and save user
        user = User(username="testuser", email="test@example.com")
        db.session.add(user)
        db.session.commit()  # This will assign an ID to the user

        # Create and save universe
        music_params = {
            "tempo": 120,
            "scale": "C major",
            "volume": 0.8
        }
        visual_params = {
            "background": "#000000",
            "particle_count": 1000,
            "animation_speed": 1.5
        }
        universe = Universe(
            name="Test Universe",
            description="A test universe",
            is_public=True,
            allow_guests=True,
            user_id=user.id,
            music_parameters=music_params,
            visual_parameters=visual_params
        )
        db.session.add(universe)
        db.session.commit()

        # Test basic attributes
        assert universe.name == "Test Universe"
        assert universe.description == "A test universe"
        assert universe.is_public is True
        assert universe.allow_guests is True
        assert universe.user_id == user.id
        assert universe.music_parameters == music_params
        assert universe.visual_parameters == visual_params
        assert isinstance(universe.created_at, datetime)
        assert isinstance(universe.updated_at, datetime)
        assert universe.collaborators_count == 0

        # Test relationships
        assert universe in user.owned_universes
        assert universe.owner == user
        assert len(universe.collaborators.all()) == 0
        assert len(user.collaborating_universes.all()) == 0

def test_universe_to_dict():
    """Test converting universe to dictionary."""
    music_params = {"tempo": 120}
    visual_params = {"background": "#000000"}
    now = datetime.now(timezone.utc)

    universe = Universe(
        name="Test Universe",
        description="A test universe",
        user_id=1,
        music_parameters=music_params,
        visual_parameters=visual_params
    )
    universe.id = 1
    universe.created_at = now
    universe.updated_at = now

    result = universe.to_dict()
    assert result["id"] == 1
    assert result["name"] == "Test Universe"
    assert result["description"] == "A test universe"
    assert result["user_id"] == 1
    assert result["music_parameters"] == music_params
    assert result["visual_parameters"] == visual_params
    assert result["created_at"] == now.isoformat()
    assert result["updated_at"] == now.isoformat()

def test_default_parameters():
    """Test default values for music and visual parameters."""
    now = datetime.now(timezone.utc)
    universe = Universe(
        name="Test Universe",
        user_id=1
    )
    universe.created_at = now
    universe.updated_at = now

    assert universe.music_parameters == {}
    assert universe.visual_parameters == {}

    result = universe.to_dict()
    assert result["music_parameters"] == {}
    assert result["visual_parameters"] == {}
    assert result["created_at"] == now.isoformat()
    assert result["updated_at"] == now.isoformat()

def test_update_parameters():
    """Test updating music and visual parameters."""
    universe = Universe(
        name="Test Universe",
        user_id=1
    )

    new_music_params = {"tempo": 140, "volume": 0.9}
    new_visual_params = {"background": "#FFFFFF", "particle_count": 2000}

    universe.music_parameters = new_music_params
    universe.visual_parameters = new_visual_params

    assert universe.music_parameters == new_music_params
    assert universe.visual_parameters == new_visual_params
