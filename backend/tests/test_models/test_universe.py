"""Tests for Universe model."""
import pytest
from datetime import datetime, timezone
from app.models.universe import Universe
from app.models.physics_parameters import PhysicsParameters

def test_universe_creation(app, user):
    """Test creating a universe."""
    universe = Universe(
        name='Test Universe',
        description='A test universe',
        is_public=True,
        allow_guests=True,
        user_id=user.id
    )

    assert universe.name == 'Test Universe'
    assert universe.description == 'A test universe'
    assert universe.is_public is True
    assert universe.allow_guests is True
    assert universe.user_id == user.id
    assert isinstance(universe.created_at, datetime)
    assert isinstance(universe.updated_at, datetime)

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
    assert 'physics_parameters' in universe_dict
    assert 'collaborators_count' in universe_dict

def test_universe_update_dependent_parameters(app, universe_factory):
    """Test updating dependent parameters."""
    universe = universe_factory(gravity=10.0)

    # Test physics update
    universe.update_dependent_parameters('physics')
    assert universe.physics_parameters.gravity == 10.0

    # Test audio update (assuming default volume)
    universe.update_dependent_parameters('audio')
    assert 1.0 <= universe.physics_parameters.gravity <= 20.0

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
    user_universe = universe_factory(creator_id=user.id)
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
        'description': 'Created from dict'
    }

    universe = Universe.from_dict(data)

    assert universe.name == data['name']
    assert universe.description == data['description']

def test_universe_generate_music_notes(app, universe_factory):
    """Test generating music notes."""
    universe = universe_factory()

    # Test without music parameters
    result = universe.generate_music_notes()
    assert 'error' in result
    assert result['error'] == 'No music parameters set'

