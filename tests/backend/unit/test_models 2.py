import pytest
from app.models.universe import Universe
from app.models.user import User
from datetime import datetime

pytestmark = pytest.mark.unit

def test_universe_creation(app, test_user):
    """Test universe creation with basic attributes."""
    with app.app_context():
        universe = Universe(
            name="Test Universe",
            creator_id=test_user.id,
            description="Test Description",
            max_participants=5,
            is_public=True
        )
        assert universe.name == "Test Universe"
        assert universe.creator_id == test_user.id
        assert universe.description == "Test Description"
        assert universe.max_participants == 5
        assert universe.is_public is True
        assert universe.is_active is True
        assert isinstance(universe.created_at, datetime)
        assert isinstance(universe.updated_at, datetime)
        assert universe.parameters == {
            'physics': {},
            'music': {},
            'visual': {}
        }

def test_universe_to_dict(app, test_user, test_universe):
    """Test universe to_dict method."""
    with app.app_context():
        universe_dict = test_universe.to_dict()
        assert universe_dict['name'] == test_universe.name
        assert universe_dict['creator_id'] == test_universe.creator_id
        assert universe_dict['description'] == test_universe.description
        assert universe_dict['is_public'] is True
        assert universe_dict['is_active'] is True
        assert 'created_at' in universe_dict
        assert 'updated_at' in universe_dict
        assert 'parameters' in universe_dict
        assert 'physics_parameters' in universe_dict
        assert 'collaborator_count' in universe_dict
        assert 'collaborators' in universe_dict

def test_universe_access_control(app, test_user):
    """Test universe access control methods."""
    with app.app_context():
        # Create another user for testing
        other_user = User(
            username="other_user",
            email="other@example.com"
        )
        other_user.set_password("password123")

        # Create a private universe
        private_universe = Universe(
            name="Private Universe",
            creator_id=test_user.id,
            is_public=False
        )

        # Test access controls
        assert private_universe.can_access(test_user) is True  # Creator should have access
        assert private_universe.can_access(other_user) is False  # Other user should not
        assert private_universe.can_modify(test_user) is True  # Creator should be able to modify
        assert private_universe.can_modify(other_user) is False  # Other user should not

def test_universe_update(app, test_universe):
    """Test universe update method."""
    with app.app_context():
        update_data = {
            'name': 'Updated Universe',
            'description': 'Updated Description',
            'max_participants': 15,
            'is_public': False
        }

        test_universe.update(update_data)

        assert test_universe.name == 'Updated Universe'
        assert test_universe.description == 'Updated Description'
        assert test_universe.max_participants == 15
        assert test_universe.is_public is False

def test_universe_soft_delete(app, test_universe):
    """Test universe soft delete and restore."""
    with app.app_context():
        assert test_universe.is_active is True

        # Test soft delete
        test_universe.delete()
        assert test_universe.is_active is False

        # Test restore
        test_universe.restore()
        assert test_universe.is_active is True

def test_universe_validation(app, test_user):
    """Test universe model validation."""
    with app.app_context():
        # Test name length validation
        with pytest.raises(ValueError):
            Universe(
                name="",  # Empty name
                creator_id=test_user.id
            )

        with pytest.raises(ValueError):
            Universe(
                name="a" * 256,  # Too long name
                creator_id=test_user.id
            )

        # Test max_participants validation
        with pytest.raises(ValueError):
            Universe(
                name="Test Universe",
                creator_id=test_user.id,
                max_participants=-1  # Invalid participant count
            )

def test_universe_defaults(app, test_user):
    """Test universe default values."""
    with app.app_context():
        universe = Universe(
            name="Test Universe",
            creator_id=test_user.id
        )

        assert universe.is_public is True  # Default to public
        assert universe.is_active is True  # Default to active
        assert universe.max_participants == 10  # Default max participants
        assert universe.parameters == {  # Default parameters
            'physics': {},
            'music': {},
            'visual': {}
        }
