import pytest
from datetime import datetime
from app.models.universe import Universe
from app.models.user import User
from app import db

@pytest.fixture
def test_user(app):
    """Create a test user"""
    user = User(username="testuser", email="test@example.com")
    user.set_password("password123")
    db.session.add(user)
    db.session.commit()
    return user

@pytest.fixture
def test_universe(test_user):
    """Create a test universe"""
    universe = Universe(
        name="Test Universe",
        owner_id=test_user.id,
        description="A test universe",
        max_participants=5,
        is_public=True
    )
    db.session.add(universe)
    db.session.commit()
    return universe

def test_universe_init():
    """Test Universe initialization"""
    universe = Universe(
        name="New Universe",
        owner_id=1,
        description="Description",
        max_participants=10,
        is_public=False
    )

    assert universe.name == "New Universe"
    assert universe.owner_id == 1
    assert universe.description == "Description"
    assert universe.max_participants == 10
    assert universe.is_public == False
    assert universe.parameters == {
        'physics': {},
        'music': {},
        'visual': {}
    }

def test_universe_repr(test_universe):
    """Test Universe string representation"""
    assert str(test_universe) == "<Universe Test Universe>"

def test_universe_to_dict(test_universe, test_user):
    """Test Universe to_dict method"""
    universe_dict = test_universe.to_dict()

    assert universe_dict["name"] == "Test Universe"
    assert universe_dict["description"] == "A test universe"
    assert universe_dict["max_participants"] == 5
    assert universe_dict["is_public"] == True
    assert universe_dict["owner_id"] == test_user.id
    assert universe_dict["owner"] == test_user.username
    assert isinstance(universe_dict["created_at"], str)
    assert isinstance(universe_dict["updated_at"], str)

def test_universe_access(test_universe, test_user):
    """Test Universe access control"""
    # Owner should have access
    assert test_universe.can_access(test_user) == True

    # Create another user
    other_user = User(username="other", email="other@example.com")
    other_user.set_password("password123")
    db.session.add(other_user)
    db.session.commit()

    # Public universe should be accessible to other users
    assert test_universe.can_access(other_user) == True

    # Make universe private
    test_universe.is_public = False
    db.session.commit()

    # Other user should not have access to private universe
    assert test_universe.can_access(other_user) == False

def test_universe_modification(test_universe, test_user):
    """Test Universe modification control"""
    # Owner should be able to modify
    assert test_universe.can_modify(test_user) == True

    # Create another user
    other_user = User(username="other", email="other@example.com")
    other_user.set_password("password123")
    db.session.add(other_user)
    db.session.commit()

    # Other user should not be able to modify
    assert test_universe.can_modify(other_user) == False
