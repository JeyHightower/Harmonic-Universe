"""Tests for Universe model."""
import pytest
from datetime import datetime
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
        universe = Universe(
            name="Test Universe",
            description="Test Description",
            user_id=user.id
        )
        db.session.add(universe)
        db.session.commit()

        # Test basic attributes
        assert universe.name == "Test Universe"
        assert universe.description == "Test Description"
        assert universe.user_id == user.id
        assert isinstance(universe.created_at, datetime)
        assert isinstance(universe.updated_at, datetime)
        assert universe.collaborators_count == 0

        # Test relationships
        assert universe in user.owned_universes
        assert universe.owner == user
        assert len(universe.collaborators.all()) == 0
        assert len(user.collaborating_universes.all()) == 0

        # Test dictionary representation
        universe_dict = universe.to_dict()
        assert universe_dict['name'] == "Test Universe"
        assert universe_dict['description'] == "Test Description"
        assert universe_dict['user_id'] == user.id
        assert 'created_at' in universe_dict
        assert 'updated_at' in universe_dict

def test_universe_to_dict(app, universe_factory):
    """Test converting universe to dictionary."""
    universe = universe_factory()
    universe_dict = universe.to_dict()

    assert universe_dict['name'] == universe.name
    assert universe_dict['description'] == universe.description
    assert universe_dict['is_public'] == universe.is_public
    assert universe_dict['allow_guests'] == universe.allow_guests
    assert universe_dict['user_id'] == universe.user_id
    assert 'created_at' in universe_dict
    assert 'updated_at' in universe_dict
    assert 'music_parameters' in universe_dict
    assert 'visual_parameters' in universe_dict
    assert 'collaborators_count' in universe_dict

def test_universe_update_parameters(app, universe_factory):
    """Test updating universe parameters."""
    universe = universe_factory()

    # Test music parameters update
    music_params = {
        'tempo': 120,
        'key': 'C',
        'scale': 'major'
    }
    universe.update_parameters('music', music_params)
    assert universe.music_parameters == music_params

    # Test visual parameters update
    visual_params = {
        'colorScheme': 'dark',
        'particleSize': 1.5
    }
    universe.update_parameters('visual', visual_params)
    assert universe.visual_parameters == visual_params

def test_universe_get_public_universes(app, universe_factory):
    """Test getting public universes."""
    # Create public and private universes
    public_universe = universe_factory(is_public=True)
    private_universe = universe_factory(is_public=False)

    public_universes = Universe.get_public_universes().all()

    assert public_universe in public_universes
    assert private_universe not in public_universes

def test_universe_get_user_universes(app, universe_factory, user):
    """Test getting user universes."""
    # Create universes
    user_universe = universe_factory(user_id=user.id)
    other_universe = universe_factory(is_public=True)
    private_universe = universe_factory(is_public=False)

    user_universes = Universe.get_user_universes(user.id).all()

    assert user_universe in user_universes
    assert other_universe in user_universes  # Public universe should be included
    assert private_universe not in user_universes  # Private universe by another user should not be included

def test_universe_from_dict(app):
    """Test creating universe from dictionary."""
    data = {
        'name': 'Dict Universe',
        'description': 'Created from dict',
        'music_parameters': {
            'tempo': 120,
            'key': 'C',
            'scale': 'major'
        },
        'visual_parameters': {
            'colorScheme': 'dark',
            'particleSize': 1.5
        }
    }

    universe = Universe.from_dict(data)

    assert universe.name == data['name']
    assert universe.description == data['description']
    assert universe.music_parameters == data['music_parameters']
    assert universe.visual_parameters == data['visual_parameters']

def test_universe_generate_music(app, universe_factory):
    """Test generating music."""
    universe = universe_factory()

    # Set music parameters
    music_params = {
        'tempo': 120,
        'key': 'C',
        'scale': 'major'
    }
    universe.update_parameters('music', music_params)

    # Test music generation
    result = universe.generate_music()
    assert 'notes' in result
    assert 'tempo' in result
    assert result['tempo'] == music_params['tempo']

