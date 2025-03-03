"""Test the universe endpoints."""
import pytest
import requests
import json
from uuid import uuid4

BASE_URL = "http://localhost:8000/api/v1"

def create_test_user():
    """Helper function to create a test user and return tokens."""
    username = f"testuser_{uuid4().hex[:8]}"
    email = f"test_{uuid4().hex[:8]}@example.com"
    password = "TestPassword123!"

    register_data = {
        "username": username,
        "email": email,
        "password": password
    }

    register_response = requests.post(f"{BASE_URL}/auth/register", json=register_data)
    assert register_response.status_code == 201, f"Registration failed: {register_response.text}"

    access_token = register_response.json()["access_token"]
    return access_token, username, email

def test_create_universe():
    """Test creating a universe."""
    # Create a test user
    access_token, username, _ = create_test_user()
    headers = {"Authorization": f"Bearer {access_token}"}

    # Test create universe
    universe_data = {
        "name": f"Test Universe {uuid4().hex[:8]}",
        "description": "A test universe for API testing",
        "is_public": True
    }

    response = requests.post(f"{BASE_URL}/universes/", json=universe_data, headers=headers)
    assert response.status_code == 201, f"Universe creation failed: {response.text}"

    universe = response.json()
    assert universe["name"] == universe_data["name"]
    assert universe["description"] == universe_data["description"]
    assert universe["is_public"] == universe_data["is_public"]

    # Test create with invalid data
    invalid_data = {
        "description": "Missing name field"
    }

    response = requests.post(f"{BASE_URL}/universes/", json=invalid_data, headers=headers)
    assert response.status_code == 400, "Should reject invalid universe data"

    return universe["id"], headers

def test_get_universes():
    """Test getting all universes for a user."""
    # Create a test user
    access_token, username, _ = create_test_user()
    headers = {"Authorization": f"Bearer {access_token}"}

    # Create a couple of universes
    for i in range(3):
        universe_data = {
            "name": f"Test Universe {i} - {uuid4().hex[:8]}",
            "description": f"Test description {i}",
            "is_public": i % 2 == 0  # Alternate between public and private
        }

        response = requests.post(f"{BASE_URL}/universes/", json=universe_data, headers=headers)
        assert response.status_code == 201

    # Test get all universes
    response = requests.get(f"{BASE_URL}/universes/", headers=headers)
    assert response.status_code == 200

    universes = response.json()
    assert len(universes) >= 3, "Should have at least the 3 universes we created"

    # Test sorting
    response = requests.get(f"{BASE_URL}/universes/?sort_by=name&sort_order=asc", headers=headers)
    assert response.status_code == 200

    sorted_universes = response.json()
    names = [u["name"] for u in sorted_universes]
    assert names == sorted(names), "Universes should be sorted by name"

def test_get_single_universe():
    """Test getting a single universe."""
    # Create a universe
    universe_id, headers = test_create_universe()

    # Get the universe
    response = requests.get(f"{BASE_URL}/universes/{universe_id}", headers=headers)
    assert response.status_code == 200

    universe = response.json()
    assert universe["id"] == universe_id

    # Test get non-existent universe
    response = requests.get(f"{BASE_URL}/universes/{uuid4()}", headers=headers)
    assert response.status_code == 404, "Should return 404 for non-existent universe"

def test_update_universe():
    """Test updating a universe."""
    # Create a universe
    universe_id, headers = test_create_universe()

    # Update the universe
    update_data = {
        "name": f"Updated Universe {uuid4().hex[:8]}",
        "description": "Updated description",
        "is_public": False
    }

    response = requests.put(f"{BASE_URL}/universes/{universe_id}", json=update_data, headers=headers)
    assert response.status_code == 200, f"Universe update failed: {response.text}"

    updated_universe = response.json()
    assert updated_universe["name"] == update_data["name"]
    assert updated_universe["description"] == update_data["description"]
    assert updated_universe["is_public"] == update_data["is_public"]

    # Test updating non-existent universe
    response = requests.put(
        f"{BASE_URL}/universes/{uuid4()}",
        json=update_data,
        headers=headers
    )
    assert response.status_code == 404, "Should return 404 for non-existent universe"

def test_delete_universe():
    """Test deleting a universe."""
    # Create a universe
    universe_id, headers = test_create_universe()

    # Delete the universe
    response = requests.delete(f"{BASE_URL}/universes/{universe_id}", headers=headers)
    assert response.status_code == 204, f"Universe deletion failed: {response.text}"

    # Verify it's deleted
    response = requests.get(f"{BASE_URL}/universes/{universe_id}", headers=headers)
    assert response.status_code == 404, "Universe should no longer exist"

    # Test deleting non-existent universe
    response = requests.delete(f"{BASE_URL}/universes/{uuid4()}", headers=headers)
    assert response.status_code == 404, "Should return 404 for non-existent universe"

def test_update_physics():
    """Test updating physics parameters for a universe."""
    pytest.skip("Physics API not implemented yet")

    # Create a universe
    universe_id, headers = test_create_universe()

    # Update physics
    physics_data = {
        "gravity": 9.8,
        "time_scale": 1.0,
        "air_resistance": 0.1,
        "collision_elasticity": 0.7,
        "friction_coefficient": 0.3
    }

    response = requests.put(
        f"{BASE_URL}/universes/{universe_id}/physics",
        json=physics_data,
        headers=headers
    )
    assert response.status_code == 200, f"Physics update failed: {response.text}"

def test_update_harmony():
    """Test updating harmony parameters for a universe."""
    pytest.skip("Harmony API not implemented yet")

    # Create a universe
    universe_id, headers = test_create_universe()

    # Update harmony
    harmony_data = {
        "tempo": 120,
        "key": "C",
        "scale": "major",
        "time_signature": "4/4",
        "chord_progression": "I-IV-V-I"
    }

    response = requests.put(
        f"{BASE_URL}/universes/{universe_id}/harmony",
        json=harmony_data,
        headers=headers
    )
    assert response.status_code == 200, f"Harmony update failed: {response.text}"

    # Verify the harmony was updated
    response = requests.get(f"{BASE_URL}/universes/{universe_id}", headers=headers)
    assert response.status_code == 200

    universe = response.json()
    assert "harmony_params" in universe
    for key, value in harmony_data.items():
        assert key in universe["harmony_params"]
        assert universe["harmony_params"][key] == value
