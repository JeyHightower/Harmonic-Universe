import pytest
from app.models.user import User
from app import db

def test_new_user():
    """Test creating a new user"""
    user = User(username="testuser", email="test@example.com")
    user.set_password("password123")

    assert user.username == "testuser"
    assert user.email == "test@example.com"
    assert user.password_hash is not None
    assert user.password_hash != "password123"

def test_password_hashing():
    """Test password hashing"""
    user = User(username="testuser", email="test@example.com")
    user.set_password("password123")

    assert user.check_password("password123") is True
    assert user.check_password("wrongpassword") is False

def test_user_repr():
    """Test user string representation"""
    user = User(username="testuser", email="test@example.com")
    assert str(user) == "<User testuser>"

@pytest.fixture
def test_user(app):
    """Create a test user"""
    user = User(username="testuser", email="test@example.com")
    user.set_password("password123")
    db.session.add(user)
    db.session.commit()
    return user

def test_user_to_dict(test_user):
    """Test user to_dict method"""
    user_dict = test_user.to_dict()

    assert user_dict["username"] == "testuser"
    assert user_dict["email"] == "test@example.com"
    assert "id" in user_dict
    assert "created_at" in user_dict
    assert "updated_at" in user_dict
    assert "password_hash" not in user_dict  # Ensure sensitive data is not included

def test_unique_username(test_user):
    """Test username uniqueness constraint"""
    duplicate_user = User(username="testuser", email="another@example.com")
    db.session.add(duplicate_user)

    with pytest.raises(Exception):  # Should raise an integrity error
        db.session.commit()
    db.session.rollback()

def test_unique_email(test_user):
    """Test email uniqueness constraint"""
    duplicate_user = User(username="another", email="test@example.com")
    db.session.add(duplicate_user)

    with pytest.raises(Exception):  # Should raise an integrity error
        db.session.commit()
    db.session.rollback()

def test_user_profile_relationship(test_user):
    """Test user-profile relationship"""
    from app.models.profile import Profile

    profile = Profile(
        user_id=test_user.id,
        bio="Test bio",
        location="Test location"
    )
    db.session.add(profile)
    db.session.commit()

    assert test_user.profile is not None
    assert test_user.profile.bio == "Test bio"
    assert test_user.profile.location == "Test location"

def test_user_universes_relationship(test_user):
    """Test user-universes relationship"""
    from app.models.universe import Universe

    universe = Universe(
        name="Test Universe",
        owner_id=test_user.id,
        description="Test Description"
    )
    db.session.add(universe)
    db.session.commit()

    assert len(test_user.universes) == 1
    assert test_user.universes[0].name == "Test Universe"
