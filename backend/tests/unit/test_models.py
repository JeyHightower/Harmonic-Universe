"""Unit tests for models."""

import pytest
from datetime import datetime
from app.models.core.user import User
from tests.utils.base_test import BaseTest

class TestUser(BaseTest):
    """Test cases for User model."""

    def test_new_user(self):
        """Test User model creation."""
        test_data = {
            "email": "test@example.com",
            "full_name": "Test User",
            "is_active": True,
            "is_superuser": False,
            "username": "testuser"
        }

        user_dict = self.create_test_user(**test_data)
        user = user_dict["obj"]

        # Verify fields
        self.assert_model_fields(user, test_data)
        self.assert_timestamps(user)

        # Verify password hashing
        assert user.hashed_password is not None
        assert user.hashed_password != "testpassword"

    def test_password_hashing(self):
        """Test password hashing."""
        user_dict = self.create_test_user(password="testpassword")
        user = user_dict["obj"]

        assert user.hashed_password is not None
        assert user.hashed_password != "testpassword"
        assert user.verify_password("testpassword") is True
        assert user.verify_password("wrongpassword") is False

    def test_password_readonly(self):
        """Test password is readonly."""
        user_dict = self.create_test_user()
        user = user_dict["obj"]

        with pytest.raises(AttributeError):
            _ = user.password

    def test_user_token(self):
        """Test user token generation."""
        user_dict = self.create_test_user(is_superuser=False)
        user = user_dict["obj"]
        token = user.get_token()

        assert isinstance(token, str)
        assert len(token) > 0

    def test_user_representation(self):
        """Test string representation of user."""
        user_dict = self.create_test_user(email="test@example.com")
        user = user_dict["obj"]
        assert str(user) == "<User test@example.com>"

    def test_email_verification(self):
        """Test email verification process."""
        user_dict = self.create_test_user()
        user = user_dict["obj"]

        # Generate verification token
        token = user.generate_email_verification_token()
        assert user.verification_token is not None
        assert len(token) > 0

        # Verify email with token
        assert user.verify_email(token) is True
        assert user.email_verified is True
        assert user.verification_token is None

        # Try verifying with invalid token
        assert user.verify_email("invalid_token") is False

    def test_user_validation(self):
        """Test user model validation."""
        # Test invalid email
        self.assert_model_validation(
            User,
            {
                "email": "invalid_email",
                "username": "testuser",
                "full_name": "Test User",
                "password": "testpass"
            },
            "Invalid email format"
        )

        # Test missing required fields
        self.assert_model_validation(
            User,
            {
                "email": "test@example.com"
            },
            "Missing required fields: username, full_name"
        )

    def test_user_relationships(self):
        """Test user relationships."""
        # Create user with related objects
        user_dict = self.create_test_user()
        user = user_dict["obj"]

        # Create universe owned by user
        universe_dict = self.create_test_universe(creator_id=user.id)
        universe = universe_dict["obj"]

        # Create scene in universe
        scene_dict = self.create_test_scene(universe_id=universe.id)
        scene = scene_dict["obj"]

        # Verify relationships
        self.assert_relationships(user, {
            "universes": [universe],
            "scenes": [scene]
        })
