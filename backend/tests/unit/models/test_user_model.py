import pytest
from datetime import datetime
from app.models.user import User
from app.models.universe import Universe
from sqlalchemy.exc import IntegrityError


def test_new_user(session):
    """Test creating a new user"""
    user = User(username="testuser", email="test@example.com")
    user.set_password("password123")
    session.add(user)
    session.commit()

    assert user.username == "testuser"
    assert user.email == "test@example.com"
    assert user.check_password("password123") is True
    assert user.check_password("wrongpassword") is False
    assert user.is_active is True
    assert user.is_admin is False
    assert isinstance(user.created_at, datetime)
    assert isinstance(user.updated_at, datetime)


def test_user_to_dict(session, test_user):
    """Test converting a user to dictionary"""
    user_dict = test_user.to_dict()

    assert user_dict["username"] == "testuser"
    assert user_dict["email"] == "test@example.com"
    assert "password_hash" not in user_dict
    assert "id" in user_dict
    assert "created_at" in user_dict
    assert "updated_at" in user_dict


def test_user_validation(session):
    """Test user validation constraints"""
    # Test missing required fields
    with pytest.raises(IntegrityError):
        user = User(email="test@example.com")  # Missing username
        session.add(user)
        session.commit()
    session.rollback()

    # Test duplicate username
    user1 = User(username="sameuser", email="user1@example.com")
    session.add(user1)
    session.commit()

    with pytest.raises(IntegrityError):
        user2 = User(username="sameuser", email="user2@example.com")
        session.add(user2)
        session.commit()
    session.rollback()

    # Test duplicate email
    user3 = User(username="user3", email="same@example.com")
    session.add(user3)
    session.commit()

    with pytest.raises(IntegrityError):
        user4 = User(username="user4", email="same@example.com")
        session.add(user4)
        session.commit()
    session.rollback()


def test_user_password_management(session):
    """Test user password management"""
    user = User(username="testuser", email="test@example.com")

    # Test password setting and checking
    user.set_password("password123")
    assert user.check_password("password123") is True
    assert user.check_password("wrongpassword") is False

    # Test password change
    user.set_password("newpassword123")
    assert user.check_password("password123") is False
    assert user.check_password("newpassword123") is True


def test_user_universe_relationships(session, test_user):
    """Test user universe relationships"""
    # Create owned universes
    universe1 = Universe(
        name="Universe 1", description="First universe", user_id=test_user.id
    )
    universe2 = Universe(
        name="Universe 2", description="Second universe", user_id=test_user.id
    )
    session.add_all([universe1, universe2])
    session.commit()

    # Test owned universes relationship
    assert len(test_user.owned_universes.all()) == 2
    assert universe1 in test_user.owned_universes
    assert universe2 in test_user.owned_universes


def test_user_universe_access(session, test_user):
    """Test user universe access control"""
    # Create another user
    other_user = User(username="otheruser", email="other@example.com")
    session.add(other_user)
    session.commit()

    # Create a private universe
    private_universe = Universe(
        name="Private Universe",
        description="A private universe",
        user_id=test_user.id,
        is_public=False,
    )
    session.add(private_universe)
    session.commit()

    # Test access control
    assert test_user.can_access(private_universe) is True  # Owner can access
    assert other_user.can_access(private_universe) is False  # Other user cannot access
    assert test_user.can_modify(private_universe) is True  # Owner can modify
    assert other_user.can_modify(private_universe) is False  # Other user cannot modify

    # Test granting and revoking access
    other_user.grant_access(private_universe)
    session.commit()
    assert other_user.can_access(private_universe) is True
    assert not other_user.can_modify(private_universe)  # Still cannot modify

    other_user.revoke_access(private_universe)
    session.commit()
    assert not other_user.can_access(private_universe)


def test_user_account_management(session, test_user):
    """Test user account management"""
    # Test account deactivation
    test_user.deactivate()
    assert test_user.is_active is False

    # Test account activation
    test_user.activate()
    assert test_user.is_active is True

    # Test last login update
    test_user.update_last_login()
    assert isinstance(test_user.last_login, datetime)

    # Test user update
    update_data = {"username": "updateduser", "email": "updated@example.com"}
    test_user.update(update_data)
    assert test_user.username == "updateduser"
    assert test_user.email == "updated@example.com"
