import pytest
from datetime import datetime
from app.models.universe import Universe
from app import db

def test_universe_creation(app, test_user):
    """Test basic universe creation"""
    with app.app_context():
        universe = Universe(
            name="Test Universe",
            creator_id=test_user.id,
            description="Test Description",
            max_participants=5,
            is_public=True
        )
        db.session.add(universe)
        db.session.commit()

        assert universe.id is not None
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

def test_universe_to_dict(app, test_user):
    """Test universe to_dict method"""
    with app.app_context():
        universe = Universe(
            name="Test Universe",
            creator_id=test_user.id
        )
        db.session.add(universe)
        db.session.commit()

        universe_dict = universe.to_dict()
        assert universe_dict['id'] == universe.id
        assert universe_dict['name'] == "Test Universe"
        assert universe_dict['creator_id'] == test_user.id
        assert universe_dict['owner'] == test_user.username
        assert universe_dict['is_public'] is True
        assert universe_dict['collaborator_count'] == 0

def test_universe_access_control(app, test_user):
    """Test universe access control methods"""
    with app.app_context():
        universe = Universe(
            name="Private Universe",
            creator_id=test_user.id,
            is_public=False
        )
        db.session.add(universe)
        db.session.commit()

        # Creator should always have access
        assert universe.can_access(test_user) is True
        assert universe.can_modify(test_user) is True

        # Create another user
        other_user = test_user.__class__(
            username="other_user",
            email="other@example.com"
        )
        other_user.set_password("password123")
        db.session.add(other_user)
        db.session.commit()

        # Other user should not have access to private universe
        assert universe.can_access(other_user) is False
        assert universe.can_modify(other_user) is False

def test_universe_update(app, test_user):
    """Test universe update method"""
    with app.app_context():
        universe = Universe(
            name="Original Name",
            creator_id=test_user.id
        )
        db.session.add(universe)
        db.session.commit()

        update_data = {
            'name': 'Updated Name',
            'description': 'Updated Description',
            'max_participants': 20,
            'is_public': False
        }

        universe.update(update_data)

        assert universe.name == 'Updated Name'
        assert universe.description == 'Updated Description'
        assert universe.max_participants == 20
        assert universe.is_public is False

def test_universe_soft_delete(app, test_user):
    """Test universe soft delete and restore"""
    with app.app_context():
        universe = Universe(
            name="Test Universe",
            creator_id=test_user.id
        )
        db.session.add(universe)
        db.session.commit()

        # Test soft delete
        universe.delete()
        assert universe.is_active is False

        # Test restore
        universe.restore()
        assert universe.is_active is True

def test_universe_collaborators(app, test_user):
    """Test universe collaborators functionality"""
    with app.app_context():
        universe = Universe(
            name="Collaborative Universe",
            creator_id=test_user.id
        )
        db.session.add(universe)

        # Create a collaborator
        collaborator = test_user.__class__(
            username="collaborator",
            email="collaborator@example.com"
        )
        collaborator.set_password("password123")
        db.session.add(collaborator)
        db.session.commit()

        # Add collaborator
        universe.collaborators.append(collaborator)
        db.session.commit()

        assert collaborator in universe.collaborators
        assert universe.collaborators.count() == 1

        # Test access for collaborator
        assert universe.can_access(collaborator) is True
        assert universe.can_modify(collaborator) is True
