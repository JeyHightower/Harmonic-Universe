"""Tests for profile routes."""
import pytest
from flask import url_for
from app.models import Profile, User


def test_create_profile(client, auth_headers, user):
    """Test profile creation."""
    data = {"bio": "Test bio", "preferences": {"theme": "dark", "notifications": True}}

    response = client.post("/api/profile", json=data, headers=auth_headers)
    assert response.status_code == 201
    assert response.json["bio"] == data["bio"]
    assert response.json["preferences"] == data["preferences"]
    assert response.json["user_id"] == user.id


def test_create_profile_duplicate(client, auth_headers, user_with_profile):
    """Test creating profile when one already exists."""
    data = {"bio": "Another bio", "preferences": {"theme": "light"}}

    response = client.post("/api/profile", json=data, headers=auth_headers)
    assert response.status_code == 400
    assert "error" in response.json
    assert "Profile already exists" in response.json["error"]


def test_get_profile(client, auth_headers, user_with_profile):
    """Test getting user profile."""
    response = client.get("/api/profile/me", headers=auth_headers)
    assert response.status_code == 200
    assert response.json["bio"] == user_with_profile.profile.bio
    assert response.json["preferences"] == user_with_profile.profile.preferences
    assert response.json["user_id"] == user_with_profile.id


def test_get_profile_not_found(client, auth_headers, user):
    """Test getting profile when none exists."""
    response = client.get("/api/profile/me", headers=auth_headers)
    assert response.status_code == 404
    assert "error" in response.json
    assert "Profile not found" in response.json["error"]


def test_update_profile(client, auth_headers, user_with_profile):
    """Test updating profile."""
    data = {
        "bio": "Updated bio",
        "preferences": {"theme": "light", "notifications": False},
    }

    response = client.put("/api/profile/me", json=data, headers=auth_headers)
    assert response.status_code == 200
    assert response.json["bio"] == data["bio"]
    assert response.json["preferences"] == data["preferences"]

    # Verify changes in database
    profile = Profile.query.filter_by(user_id=user_with_profile.id).first()
    assert profile.bio == data["bio"]
    assert profile.preferences == data["preferences"]


def test_update_profile_not_found(client, auth_headers, user):
    """Test updating profile when none exists."""
    data = {"bio": "Updated bio", "preferences": {"theme": "light"}}

    response = client.put("/api/profile/me", json=data, headers=auth_headers)
    assert response.status_code == 404
    assert "error" in response.json
    assert "Profile not found" in response.json["error"]


def test_update_profile_partial(client, auth_headers, user_with_profile):
    """Test partial profile update."""
    original_preferences = user_with_profile.profile.preferences
    data = {"bio": "Updated bio only"}

    response = client.put("/api/profile/me", json=data, headers=auth_headers)
    assert response.status_code == 200
    assert response.json["bio"] == data["bio"]
    assert response.json["preferences"] == original_preferences


def test_update_profile_invalid_data(client, auth_headers, user_with_profile):
    """Test updating profile with invalid data."""
    data = {"preferences": "invalid"}  # Should be a dict

    response = client.put("/api/profile/me", json=data, headers=auth_headers)
    assert response.status_code == 422
    assert "error" in response.json
