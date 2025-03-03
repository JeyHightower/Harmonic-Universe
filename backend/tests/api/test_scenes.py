"""Test the scene endpoints."""
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

def test_create_scene():
    """Test creating a scene."""
    # Create a test user and universe
    access_token, username, _ = create_test_user()
    headers = {"Authorization": f"Bearer {access_token}"}
    universe_id = create_test_universe(headers)

    # Test create scene
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
    assert scene["name"] == scene_data["name"]
    assert scene["description"] == scene_data["description"]
    assert scene["universe_id"] == universe_id
    assert scene["scene_order"] == scene_data["scene_order"]
    assert scene["is_active"] == scene_data["is_active"]

    # Test create with invalid data
    invalid_data = {
        "description": "Missing required fields"
    }

    response = requests.post(f"{BASE_URL}/scenes/", json=invalid_data, headers=headers)
    assert response.status_code == 400, "Should reject invalid scene data"

    return scene["id"], universe_id, headers

def test_get_scenes():
    """Test getting all scenes."""
    # Create a test user and universe
    access_token, username, _ = create_test_user()
    headers = {"Authorization": f"Bearer {access_token}"}
    universe_id = create_test_universe(headers)

    # Create a few scenes
    for i in range(3):
        scene_data = {
            "name": f"Test Scene {i} - {uuid4().hex[:8]}",
            "description": f"Test description {i}",
            "universe_id": universe_id,
            "scene_order": i,
            "is_active": i % 2 == 0  # Alternate between active and inactive
        }

        response = requests.post(f"{BASE_URL}/scenes/", json=scene_data, headers=headers)
        assert response.status_code == 201

    # Test get all scenes
    response = requests.get(f"{BASE_URL}/scenes/?universe_id={universe_id}", headers=headers)
    assert response.status_code == 200

    scenes = response.json()
    assert len(scenes) >= 3, "Should have at least the 3 scenes we created"

    # Test getting scenes by creator
    response = requests.get(f"{BASE_URL}/scenes/", headers=headers)
    assert response.status_code == 200

    creator_scenes = response.json()
    assert len(creator_scenes) >= 3, "Should have at least the 3 scenes we created"

def test_get_single_scene():
    """Test getting a single scene."""
    # Create a scene
    scene_id, universe_id, headers = test_create_scene()

    # Get the scene
    response = requests.get(f"{BASE_URL}/scenes/{scene_id}", headers=headers)
    assert response.status_code == 200

    scene = response.json()
    assert scene["id"] == scene_id
    assert scene["universe_id"] == universe_id

    # Test get non-existent scene
    response = requests.get(f"{BASE_URL}/scenes/{uuid4()}", headers=headers)
    assert response.status_code == 404, "Should return 404 for non-existent scene"

def test_update_scene():
    """Test updating a scene."""
    # Create a scene
    scene_id, universe_id, headers = test_create_scene()

    # Update the scene
    update_data = {
        "name": f"Updated Scene {uuid4().hex[:8]}",
        "description": "Updated description",
        "is_active": False,
        "scene_order": 2
    }

    response = requests.put(f"{BASE_URL}/scenes/{scene_id}", json=update_data, headers=headers)
    assert response.status_code == 200, f"Scene update failed: {response.text}"

    updated_scene = response.json()
    assert updated_scene["name"] == update_data["name"]
    assert updated_scene["description"] == update_data["description"]
    assert updated_scene["is_active"] == update_data["is_active"]
    assert updated_scene["scene_order"] == update_data["scene_order"]

    # Test updating non-existent scene
    response = requests.put(
        f"{BASE_URL}/scenes/{uuid4()}",
        json=update_data,
        headers=headers
    )
    assert response.status_code == 404, "Should return 404 for non-existent scene"

def test_delete_scene():
    """Test deleting a scene."""
    # Create a scene
    scene_id, universe_id, headers = test_create_scene()

    # Delete the scene
    response = requests.delete(f"{BASE_URL}/scenes/{scene_id}", headers=headers)
    assert response.status_code == 200, f"Scene deletion failed: {response.text}"

    # Verify it's deleted
    response = requests.get(f"{BASE_URL}/scenes/{scene_id}", headers=headers)
    assert response.status_code == 404, "Scene should no longer exist"

    # Test deleting non-existent scene
    response = requests.delete(f"{BASE_URL}/scenes/{uuid4()}", headers=headers)
    assert response.status_code == 404, "Should return 404 for non-existent scene"

def test_reorder_scenes():
    """Test reordering scenes."""
    # Create a test user and universe
    access_token, username, _ = create_test_user()
    headers = {"Authorization": f"Bearer {access_token}"}
    universe_id = create_test_universe(headers)

    # Create a few scenes
    scene_ids = []
    for i in range(3):
        scene_data = {
            "name": f"Test Scene {i} - {uuid4().hex[:8]}",
            "description": f"Test description {i}",
            "universe_id": universe_id,
            "scene_order": i,
            "is_active": True
        }

        response = requests.post(f"{BASE_URL}/scenes/", json=scene_data, headers=headers)
        assert response.status_code == 201
        scene_ids.append(response.json()["id"])

    # Reorder the scenes
    reorder_data = {
        "universe_id": universe_id,
        "scene_ids": list(reversed(scene_ids))  # Reverse the order
    }

    response = requests.post(f"{BASE_URL}/scenes/reorder", json=reorder_data, headers=headers)
    assert response.status_code == 200, f"Scene reordering failed: {response.text}"

    # Verify the order was updated
    response = requests.get(f"{BASE_URL}/scenes/?universe_id={universe_id}", headers=headers)
    assert response.status_code == 200

    scenes = response.json()
    scene_dict = {scene["id"]: scene for scene in scenes if scene["id"] in scene_ids}

    # Check that the order matches our reversed list
    for i, scene_id in enumerate(reversed(scene_ids)):
        assert scene_dict[scene_id]["scene_order"] == i, f"Scene {scene_id} should have order {i}"

def test_physics_parameters():
    """Test physics parameters for a scene."""
    pytest.skip("Physics API not implemented yet")

    # Create a scene
    scene_id, universe_id, headers = test_create_scene()

    # Create physics parameters
    physics_data = {
        "name": "Test Physics Parameters",
        "gravity": 9.8,
        "time_scale": 1.0,
        "air_resistance": 0.1,
        "collision_elasticity": 0.7,
        "friction_coefficient": 0.3
    }

    response = requests.post(
        f"{BASE_URL}/scenes/{scene_id}/physics_parameters",
        json=physics_data,
        headers=headers
    )
    assert response.status_code == 201, f"Physics parameters creation failed: {response.text}"

    params_id = response.json()["id"]

    # Get physics parameters
    response = requests.get(f"{BASE_URL}/scenes/{scene_id}/physics_parameters", headers=headers)
    assert response.status_code == 200

    params_list = response.json()
    assert len(params_list) >= 1

    # Get specific physics parameter
    response = requests.get(f"{BASE_URL}/scenes/{scene_id}/physics_parameters/{params_id}", headers=headers)
    assert response.status_code == 200

    params = response.json()
    assert params["name"] == physics_data["name"]
    assert params["gravity"] == physics_data["gravity"]

    # Update physics parameters
    update_data = {
        "name": "Updated Physics Parameters",
        "gravity": 5.0
    }

    response = requests.put(
        f"{BASE_URL}/scenes/{scene_id}/physics_parameters/{params_id}",
        json=update_data,
        headers=headers
    )
    assert response.status_code == 200, f"Physics parameters update failed: {response.text}"

    updated_params = response.json()
    assert updated_params["name"] == update_data["name"]
    assert updated_params["gravity"] == update_data["gravity"]

    # Delete physics parameters
    response = requests.delete(f"{BASE_URL}/scenes/{scene_id}/physics_parameters/{params_id}", headers=headers)
    assert response.status_code == 200, f"Physics parameters deletion failed: {response.text}"

    # Verify it's deleted
    response = requests.get(f"{BASE_URL}/scenes/{scene_id}/physics_parameters/{params_id}", headers=headers)
    assert response.status_code == 404, "Physics parameters should no longer exist"
