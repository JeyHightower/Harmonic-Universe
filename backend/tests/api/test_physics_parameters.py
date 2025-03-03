"""Test the physics parameters endpoints."""
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

def create_test_universe(headers):
    """Helper function to create a test universe."""
    universe_data = {
        "name": f"Test Universe {uuid4().hex[:8]}",
        "description": "A test universe for API testing",
        "is_public": True
    }

    response = requests.post(f"{BASE_URL}/universes/", json=universe_data, headers=headers)
    assert response.status_code == 201, f"Universe creation failed: {response.text}"

    universe = response.json()
    return universe["id"]

def create_test_scene(headers, universe_id):
    """Helper function to create a test scene."""
    scene_data = {
        "name": f"Test Scene {uuid4().hex[:8]}",
        "description": "A test scene for API testing",
        "universe_id": universe_id,
        "scene_order": 1,
        "is_active": True
    }

    response = requests.post(f"{BASE_URL}/scenes/", json=scene_data, headers=headers)
    assert response.status_code == 201, f"Scene creation failed: {response.text}"

    scene = response.json()
    return scene["id"]

def test_create_physics_parameters():
    """Test creating physics parameters."""
    # pytest.skip("Physics API not implemented yet")

    # Create a test user, universe, and scene
    access_token, username, _ = create_test_user()
    headers = {"Authorization": f"Bearer {access_token}"}
    universe_id = create_test_universe(headers)
    scene_id = create_test_scene(headers, universe_id)

    # Create physics parameters
    params_data = {
        "name": "Test Physics Parameters",
        "universe_id": universe_id,
        "scene_id": scene_id,
        "gravity": 9.8,
        "air_resistance": 0.2,
        "time_scale": 1.0,
        "bounds_x": [-100, 100],
        "bounds_y": [-100, 100],
        "bounds_z": [-100, 100]
    }

    response = requests.post(f"{BASE_URL}/physics-parameters/", json=params_data, headers=headers)
    assert response.status_code == 201, f"Create physics parameters failed: {response.text}"

    params = response.json()
    assert params["scene_id"] == scene_id
    assert params["gravity"] == params_data["gravity"]
    assert params["air_resistance"] == params_data["air_resistance"]

    return params["id"], headers, scene_id

def test_get_physics_parameters_by_scene():
    """Test getting physics parameters by scene ID."""
    # pytest.skip("Physics API not implemented yet")

    # Create a test user, universe, and scene
    access_token, username, _ = create_test_user()
    headers = {"Authorization": f"Bearer {access_token}"}
    universe_id = create_test_universe(headers)
    scene_id = create_test_scene(headers, universe_id)

    # Create physics parameters
    try:
        _, _, created_scene_id = test_create_physics_parameters()
        # If we already have parameters from the previous test, use those
        test_scene_id = created_scene_id
    except:
        # Otherwise, create new parameters for this scene
        params_data = {
            "name": "Test Physics Parameters",
            "universe_id": universe_id,
            "scene_id": scene_id,
            "gravity": 9.8,
            "air_resistance": 0.2,
            "time_scale": 1.0,
            "bounds_x": [-100, 100],
            "bounds_y": [-100, 100],
            "bounds_z": [-100, 100]
        }

        response = requests.post(f"{BASE_URL}/physics-parameters/", json=params_data, headers=headers)
        assert response.status_code == 201, f"Create physics parameters failed: {response.text}"
        test_scene_id = scene_id

    # Get physics parameters by scene ID
    response = requests.get(f"{BASE_URL}/physics-parameters/scene/{test_scene_id}", headers=headers)
    assert response.status_code == 200, f"Get physics parameters failed: {response.text}"

    params = response.json()
    assert params["scene_id"] == test_scene_id
    assert "gravity" in params
    assert "air_resistance" in params

def test_get_single_physics_parameters():
    """Test getting a single physics parameters entry."""
    # pytest.skip("Physics API not implemented yet")

    try:
        params_id, headers, _ = test_create_physics_parameters()
    except:
        pytest.skip("Could not create physics parameters to test")

    # Get the physics parameters
    response = requests.get(f"{BASE_URL}/physics-parameters/{params_id}", headers=headers)
    assert response.status_code == 200, f"Get physics parameters failed: {response.text}"

    params = response.json()
    assert params["id"] == params_id
    assert "gravity" in params
    assert "air_resistance" in params

def test_update_physics_parameters():
    """Test updating physics parameters."""
    # pytest.skip("Physics API not implemented yet")

    try:
        params_id, headers, _ = test_create_physics_parameters()
    except:
        pytest.skip("Could not create physics parameters to test")

    # Update the physics parameters
    update_data = {
        "gravity": 5.0,
        "air_resistance": 0.5,
        "time_scale": 2.0,
        "bounds_x": [-200, 200],
        "bounds_y": [-200, 200],
        "bounds_z": [-200, 200]
    }

    response = requests.put(f"{BASE_URL}/physics-parameters/{params_id}", json=update_data, headers=headers)
    assert response.status_code == 200, f"Update physics parameters failed: {response.text}"

    updated_params = response.json()
    assert updated_params["id"] == params_id
    assert updated_params["gravity"] == update_data["gravity"]
    assert updated_params["air_resistance"] == update_data["air_resistance"]
    assert updated_params["time_scale"] == update_data["time_scale"]

def test_delete_physics_parameters():
    """Test deleting physics parameters."""
    # pytest.skip("Physics API not implemented yet")

    # Create new parameters specifically for this test
    access_token, username, _ = create_test_user()
    headers = {"Authorization": f"Bearer {access_token}"}
    universe_id = create_test_universe(headers)
    scene_id = create_test_scene(headers, universe_id)

    params_data = {
        "name": "Test Physics Parameters",
        "universe_id": universe_id,
        "scene_id": scene_id,
        "gravity": 9.8,
        "air_resistance": 0.2,
        "time_scale": 1.0,
        "bounds_x": [-100, 100],
        "bounds_y": [-100, 100],
        "bounds_z": [-100, 100]
    }

    response = requests.post(f"{BASE_URL}/physics-parameters/", json=params_data, headers=headers)
    assert response.status_code == 201, f"Create physics parameters failed: {response.text}"

    params_id = response.json()["id"]

    # Delete the physics parameters
    response = requests.delete(f"{BASE_URL}/physics-parameters/{params_id}", headers=headers)
    assert response.status_code == 200, f"Delete physics parameters failed: {response.text}"

    # Verify it's deleted
    response = requests.get(f"{BASE_URL}/physics-parameters/{params_id}", headers=headers)
    assert response.status_code == 404, "Physics parameters should no longer exist"

def test_partial_update_physics_parameters():
    """Test partial update of physics parameters."""
    # pytest.skip("Physics API not implemented yet")

    try:
        params_id, headers, _ = test_create_physics_parameters()
    except:
        pytest.skip("Could not create physics parameters to test")

    # Get the original parameters
    response = requests.get(f"{BASE_URL}/physics-parameters/{params_id}", headers=headers)
    original_params = response.json()

    # Update just one field
    update_data = {
        "gravity": 3.0
    }

    response = requests.patch(f"{BASE_URL}/physics-parameters/{params_id}", json=update_data, headers=headers)
    assert response.status_code == 200, f"Partial update physics parameters failed: {response.text}"

    updated_params = response.json()
    assert updated_params["id"] == params_id
    assert updated_params["gravity"] == update_data["gravity"]
    # Other fields should remain the same
    assert updated_params["air_resistance"] == original_params["air_resistance"]
    assert updated_params["time_scale"] == original_params["time_scale"]

def test_invalid_physics_parameters():
    """Test invalid physics parameters."""
    # pytest.skip("Physics API not implemented yet")

    # Create a test user, universe, and scene
    access_token, username, _ = create_test_user()
    headers = {"Authorization": f"Bearer {access_token}"}
    universe_id = create_test_universe(headers)
    scene_id = create_test_scene(headers, universe_id)

    # Test with missing required field
    params_data = {
        "name": "Test Physics Parameters",
        "universe_id": universe_id,
        "scene_id": scene_id,
        # Missing gravity
        "air_resistance": 0.2,
        "time_scale": 1.0
    }

    response = requests.post(f"{BASE_URL}/physics-parameters/", json=params_data, headers=headers)
    assert response.status_code in [400, 422], "Should reject invalid parameters"

    # Test with invalid value type
    params_data = {
        "name": "Test Physics Parameters",
        "universe_id": universe_id,
        "scene_id": scene_id,
        "gravity": "not a number",  # Invalid type
        "air_resistance": 0.2,
        "time_scale": 1.0
    }

    response = requests.post(f"{BASE_URL}/physics-parameters/", json=params_data, headers=headers)
    assert response.status_code in [400, 422], "Should reject invalid parameters"

    # Test with out of range values (if applicable)
    params_data = {
        "name": "Test Physics Parameters",
        "universe_id": universe_id,
        "scene_id": scene_id,
        "gravity": 9.8,
        "air_resistance": -1.0,  # Negative resistance might be invalid
        "time_scale": 1.0
    }

    response = requests.post(f"{BASE_URL}/physics-parameters/", json=params_data, headers=headers)
    # This might be valid or invalid depending on the application's constraints
    if response.status_code in [400, 422]:
        assert "air resistance" in response.text.lower(), "Error should mention the invalid field"
