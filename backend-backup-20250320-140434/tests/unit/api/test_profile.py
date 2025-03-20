import pytest
from app.models.profile import Profile
from app.models.user import User
from datetime import datetime


def test_profile_creation(app, test_user):
    """Test profile creation with basic attributes."""
    with app.app_context():
        profile = Profile(
            user_id=test_user.id,
            bio="Test bio",
            avatar_url="http://example.com/avatar.jpg",
            preferences={"theme": "dark", "notifications": True},
        )
        assert profile.user_id == test_user.id
        assert profile.bio == "Test bio"
        assert profile.avatar_url == "http://example.com/avatar.jpg"
        assert profile.preferences == {"theme": "dark", "notifications": True}
        assert isinstance(profile.created_at, datetime)
        assert isinstance(profile.updated_at, datetime)


def test_profile_to_dict(app, test_user):
    """Test profile to_dict method."""
    with app.app_context():
        profile = Profile(
            user_id=test_user.id,
            bio="Test bio",
            avatar_url="http://example.com/avatar.jpg",
            preferences={"theme": "dark", "notifications": True},
        )
        profile_dict = profile.to_dict()
        assert profile_dict["user_id"] == test_user.id
        assert profile_dict["bio"] == "Test bio"
        assert profile_dict["avatar_url"] == "http://example.com/avatar.jpg"
        assert profile_dict["preferences"] == {"theme": "dark", "notifications": True}
        assert "created_at" in profile_dict
        assert "updated_at" in profile_dict


def test_profile_update(app, test_user):
    """Test profile update method."""
    with app.app_context():
        profile = Profile(
            user_id=test_user.id,
            bio="Original bio",
            avatar_url="http://example.com/old.jpg",
            preferences={"theme": "light", "notifications": False},
        )

        update_data = {
            "bio": "Updated bio",
            "avatar_url": "http://example.com/new.jpg",
            "preferences": {"theme": "dark", "notifications": True},
        }

        profile.update(update_data)

        assert profile.bio == "Updated bio"
        assert profile.avatar_url == "http://example.com/new.jpg"
        assert profile.preferences == {"theme": "dark", "notifications": True}


def test_profile_validation(app, test_user):
    """Test profile validation rules."""
    with app.app_context():
        # Test bio length validation
        long_bio = "x" * 1001  # Assuming max length is 1000
        profile = Profile(user_id=test_user.id, bio=long_bio)
        with pytest.raises(ValueError):
            profile.validate()

        # Test avatar URL validation
        invalid_url = "not_a_url"
        profile = Profile(user_id=test_user.id, avatar_url=invalid_url)
        with pytest.raises(ValueError):
            profile.validate()


def test_profile_preferences_validation(app, test_user):
    """Test profile preferences validation."""
    with app.app_context():
        # Test invalid theme
        profile = Profile(
            user_id=test_user.id,
            preferences={"theme": "invalid_theme", "notifications": True},
        )
        with pytest.raises(ValueError):
            profile.validate()

        # Test invalid notifications value
        profile = Profile(
            user_id=test_user.id,
            preferences={"theme": "dark", "notifications": "not_a_boolean"},
        )
        with pytest.raises(ValueError):
            profile.validate()
