"""Tests for Collaborator model."""
import pytest
from datetime import datetime
from app.models.collaborator import Collaborator
from app.models.universe import Universe
from app.models.user import User


def test_new_collaborator():
    """Test creating a new collaborator."""
    user = User(username="testuser", email="test@example.com")
    collaborator = User(username="collaborator", email="collaborator@example.com")
    universe = Universe(name="Test Universe", description="Test Universe", user=user)
    collaboration = Collaborator(
        universe_id=1,  # Simulated ID
        user_id=2,  # Simulated ID
        role=Collaborator.ROLE_EDITOR,
    )

    assert collaboration.universe_id == 1
    assert collaboration.user_id == 2
    assert collaboration.role == Collaborator.ROLE_EDITOR
    assert isinstance(collaboration.joined_at, datetime)
    assert isinstance(collaboration.last_active_at, datetime)


def test_collaborator_to_dict():
    """Test converting collaborator to dictionary."""
    user = User(username="testuser", email="test@example.com")
    collaborator = User(username="collaborator", email="collaborator@example.com")
    universe = Universe(name="Test Universe", description="Test Universe", user=user)
    collaboration = Collaborator(
        universe_id=1,  # Simulated ID
        user_id=2,  # Simulated ID
        role=Collaborator.ROLE_EDITOR,
    )

    collab_dict = collaboration.to_dict()
    assert collab_dict["universe_id"] == 1
    assert collab_dict["user_id"] == 2
    assert collab_dict["role"] == Collaborator.ROLE_EDITOR
    assert "id" in collab_dict
    assert "joined_at" in collab_dict
    assert "last_active_at" in collab_dict


def test_collaborator_permissions():
    """Test collaborator permission methods."""
    collaboration = Collaborator(
        universe_id=1, user_id=2, role=Collaborator.ROLE_EDITOR
    )

    # Test editor permissions
    assert collaboration.can_edit() is True
    assert collaboration.can_manage_collaborators() is False

    # Test admin permissions
    collaboration.role = Collaborator.ROLE_ADMIN
    assert collaboration.can_edit() is True
    assert collaboration.can_manage_collaborators() is True

    # Test viewer permissions
    collaboration.role = Collaborator.ROLE_VIEWER
    assert collaboration.can_edit() is False
    assert collaboration.can_manage_collaborators() is False


def test_invalid_role():
    """Test validation of invalid roles."""
    with pytest.raises(ValueError) as excinfo:
        Collaborator(universe_id=1, user_id=2, role="invalid_role")
    assert "Invalid role" in str(excinfo.value)


def test_update_last_active():
    """Test updating last active timestamp."""
    collaboration = Collaborator(
        universe_id=1, user_id=2, role=Collaborator.ROLE_EDITOR
    )
    original_timestamp = collaboration.last_active_at

    # Wait a moment to ensure timestamp changes
    import time

    time.sleep(0.1)

    collaboration.update_last_active()
    assert collaboration.last_active_at > original_timestamp
