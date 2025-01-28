import pytest
from datetime import datetime
import json
from app.models.profile import Profile
from app import db

def test_profile_creation(app, test_user):
    """Test basic profile creation"""
    with app.app_context():
        profile = Profile(
            user_id=test_user.id,
            bio="Test Bio",
            location="Test Location",
            preferences={"theme": "dark"}
        )
        db.session.add(profile)
        db.session.commit()

        assert profile.id is not None
        assert profile.user_id == test_user.id
        assert profile.bio == "Test Bio"
        assert profile.location == "Test Location"
        assert profile.get_preferences() == {"theme": "dark"}
        assert isinstance(profile.created_at, datetime)
        assert isinstance(profile.updated_at, datetime)

def test_profile_creation_validation(app, test_user):
    """Test profile creation validation"""
    with app.app_context():
        # Test missing user_id
        with pytest.raises(ValueError, match="user_id is required"):
            Profile(user_id=None)

        # Test bio length validation
        with pytest.raises(ValueError, match="Bio must be less than 500 characters"):
            Profile(
                user_id=test_user.id,
                bio="x" * 501
            )

        # Test location length validation
        with pytest.raises(ValueError, match="Location must be less than 200 characters"):
            Profile(
                user_id=test_user.id,
                location="x" * 201
            )

def test_profile_preferences(app, test_user):
    """Test profile preferences handling"""
    with app.app_context():
        profile = Profile(user_id=test_user.id)

        # Test setting valid preferences
        prefs = {"theme": "dark", "notifications": True}
        profile.set_preferences(prefs)
        assert profile.get_preferences() == prefs

        # Test setting preferences as JSON string
        prefs_str = '{"theme": "light"}'
        profile.set_preferences(prefs_str)
        assert profile.get_preferences() == {"theme": "light"}

        # Test invalid JSON string
        profile.set_preferences("invalid json")
        assert profile.get_preferences() == {}

        # Test invalid preferences type
        profile.set_preferences(None)
        assert profile.get_preferences() == {}

def test_profile_update(app, test_user):
    """Test profile update method"""
    with app.app_context():
        profile = Profile(
            user_id=test_user.id,
            bio="Original Bio",
            location="Original Location",
            preferences={"theme": "dark"}
        )
        db.session.add(profile)
        db.session.commit()

        # Test valid update
        update_data = {
            "bio": "Updated Bio",
            "location": "Updated Location",
            "preferences": {"theme": "light", "notifications": True}
        }
        profile.update(update_data)

        assert profile.bio == "Updated Bio"
        assert profile.location == "Updated Location"
        assert profile.get_preferences() == {"theme": "light", "notifications": True}

        # Test partial update
        profile.update({"bio": "New Bio"})
        assert profile.bio == "New Bio"
        assert profile.location == "Updated Location"  # Unchanged

        # Test invalid update data
        with pytest.raises(ValueError, match="Update data must be a dictionary"):
            profile.update("invalid")

def test_profile_to_dict(app, test_user):
    """Test profile to_dict method"""
    with app.app_context():
        profile = Profile(
            user_id=test_user.id,
            bio="Test Bio",
            location="Test Location",
            preferences={"theme": "dark"}
        )
        db.session.add(profile)
        db.session.commit()

        profile_dict = profile.to_dict()
        assert profile_dict["id"] == profile.id
        assert profile_dict["user_id"] == test_user.id
        assert profile_dict["bio"] == "Test Bio"
        assert profile_dict["location"] == "Test Location"
        assert profile_dict["preferences"] == {"theme": "dark"}
        assert isinstance(profile_dict["created_at"], str)
        assert isinstance(profile_dict["updated_at"], str)

def test_profile_json_serialization(app, test_user):
    """Test profile JSON serialization"""
    with app.app_context():
        profile = Profile(
            user_id=test_user.id,
            bio="Test Bio",
            preferences={"theme": "dark"}
        )
        db.session.add(profile)
        db.session.commit()

        # Test __json__ method
        json_data = profile.__json__()
        assert json_data == profile.to_dict()

        # Verify JSON serialization works
        try:
            json.dumps(json_data)
        except Exception as e:
            pytest.fail(f"JSON serialization failed: {str(e)}")
