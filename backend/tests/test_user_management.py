"""Test suite for user management functionality."""
import pytest
from flask import url_for
from app.models import User, Profile
from .factories import UserFactory, ProfileFactory


def test_user_registration(client, session):
    """Test user registration endpoint."""
    response = client.post(
        "/api/auth/register",
        json={
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "password123",
        },
    )
    assert response.status_code == 201
    assert response.json["message"] == "User registered successfully"

    user = User.query.filter_by(email="newuser@example.com").first()
    assert user is not None
    assert user.username == "newuser"
    assert user.check_password("password123")


def test_user_registration_duplicate_email(client, user):
    """Test registration with duplicate email."""
    response = client.post(
        "/api/auth/register",
        json={"username": "another", "email": user.email, "password": "password123"},
    )
    assert response.status_code == 400
    assert "email already exists" in response.json["message"].lower()


def test_user_login(client, user):
    """Test user login endpoint."""
    response = client.post(
        "/api/auth/login", json={"email": user.email, "password": "password123"}
    )
    assert response.status_code == 200
    assert "access_token" in response.json
    assert "user" in response.json
    assert response.json["user"]["email"] == user.email


def test_user_login_invalid_credentials(client, user):
    """Test login with invalid credentials."""
    response = client.post(
        "/api/auth/login", json={"email": user.email, "password": "wrongpassword"}
    )
    assert response.status_code == 401
    assert "invalid credentials" in response.json["message"].lower()


def test_user_profile_get(client, profile, auth_headers):
    """Test getting user profile."""
    response = client.get("/api/users/profile", headers=auth_headers)
    assert response.status_code == 200
    assert response.json["bio"] == profile.bio
    assert response.json["preferences"] == profile.preferences


def test_user_profile_update(client, profile, auth_headers):
    """Test updating user profile."""
    new_bio = "Updated bio"
    new_preferences = {"theme": "light"}

    response = client.put(
        "/api/users/profile",
        json={"bio": new_bio, "preferences": new_preferences},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json["bio"] == new_bio
    assert response.json["preferences"] == new_preferences

    # Verify database update
    updated_profile = Profile.query.get(profile.id)
    assert updated_profile.bio == new_bio
    assert updated_profile.preferences == new_preferences


def test_user_password_change(client, user, auth_headers):
    """Test changing user password."""
    response = client.put(
        "/api/users/password",
        json={"current_password": "password123", "new_password": "newpassword123"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json["message"] == "Password updated successfully"

    # Verify password change
    user.refresh_from_db()
    assert user.check_password("newpassword123")


def test_user_password_change_invalid_current(client, user, auth_headers):
    """Test password change with invalid current password."""
    response = client.put(
        "/api/users/password",
        json={"current_password": "wrongpassword", "new_password": "newpassword123"},
        headers=auth_headers,
    )
    assert response.status_code == 400
    assert "current password is incorrect" in response.json["message"].lower()


def test_user_account_deactivation(client, user, auth_headers):
    """Test user account deactivation."""
    response = client.delete("/api/users/account", headers=auth_headers)
    assert response.status_code == 200
    assert response.json["message"] == "Account deactivated successfully"

    # Verify user is deactivated
    user.refresh_from_db()
    assert not user.is_active


def test_user_account_reactivation(client, user, auth_headers):
    """Test user account reactivation."""
    # First deactivate
    user.is_active = False
    user.save()

    response = client.post("/api/users/reactivate", headers=auth_headers)
    assert response.status_code == 200
    assert response.json["message"] == "Account reactivated successfully"

    # Verify user is reactivated
    user.refresh_from_db()
    assert user.is_active


def test_user_session_management(client, user, auth_headers):
    """Test user session management."""
    # Get active sessions
    response = client.get("/api/users/sessions", headers=auth_headers)
    assert response.status_code == 200
    assert "active_sessions" in response.json

    # Logout from all sessions
    response = client.post("/api/users/logout-all", headers=auth_headers)
    assert response.status_code == 200
    assert response.json["message"] == "Logged out from all sessions"


def test_user_activity_log(client, user, auth_headers):
    """Test user activity log."""
    response = client.get("/api/users/activity", headers=auth_headers)
    assert response.status_code == 200
    assert "activities" in response.json


def test_user_preferences_sync(client, profile, auth_headers):
    """Test user preferences synchronization."""
    new_preferences = {
        "theme": "dark",
        "notifications": {"email": True, "push": False},
        "display": {"sidebar": True, "toolbar": True},
    }

    response = client.put(
        "/api/users/preferences",
        json={"preferences": new_preferences},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json["preferences"] == new_preferences

    # Verify database update
    profile.refresh_from_db()
    assert profile.preferences == new_preferences
