"""Test the physics objects endpoints."""
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
    user_id = register_response.json()["user"]["id"]
    return access_token, user_id, username, email

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

def create_physics_object_helper():
    """Helper function to create a physics object and return all necessary IDs and headers."""
    # Create a test user, universe, and scene
    access_token, user_id, username, _ = create_test_user()
    headers = {"Authorization": f"Bearer {access_token}"}

    print(f"\n\nDEBUG - create_physics_object_helper:")
    print(f"Created user_id: {user_id}")
    print(f"Headers: {headers}")

    universe_id = create_test_universe(headers)
    print(f"Created universe_id: {universe_id}")

    scene_id = create_test_scene(headers, universe_id)
    print(f"Created scene_id: {scene_id}")

    # Create physics object
    physics_object_data = {
        "name": f"Test Physics Object {uuid4().hex[:8]}",
        "type": "sphere",
        "universe_id": universe_id,
        "scene_id": scene_id,
        "position": {"x": 0, "y": 0, "z": 0},
        "rotation": {"x": 0, "y": 0, "z": 0},
        "scale": {"x": 1, "y": 1, "z": 1},
        "mass": 1.0,
        "velocity": {"x": 0, "y": 0, "z": 0},
        "parameters": {
            "radius": 1.0,
            "color": "#FF0000"
        }
    }

    response = requests.post(f"{BASE_URL}/physics-objects/", json=physics_object_data, headers=headers)
    print(f"POST physics object status: {response.status_code}")
    if response.status_code != 201:
        print(f"POST physics object failed: {response.text}")

    assert response.status_code == 201, f"Physics object creation failed: {response.text}"

    physics_object = response.json()
    print(f"Created physics_object_id: {physics_object['id']}")
    print(f"Physics object user_id: {physics_object.get('user_id')}")
    print(f"Current user_id: {user_id}")

    return physics_object["id"], universe_id, scene_id, headers, user_id

def test_create_physics_object():
    """Test creating a physics object."""
    # Create a test user, universe, and scene
    access_token, user_id, username, _ = create_test_user()
    headers = {"Authorization": f"Bearer {access_token}"}
    universe_id = create_test_universe(headers)
    scene_id = create_test_scene(headers, universe_id)

    # Test create physics object
    physics_object_data = {
        "name": f"Test Physics Object {uuid4().hex[:8]}",
        "type": "sphere",
        "universe_id": universe_id,
        "scene_id": scene_id,
        "position": {"x": 0, "y": 0, "z": 0},
        "rotation": {"x": 0, "y": 0, "z": 0},
        "scale": {"x": 1, "y": 1, "z": 1},
        "mass": 1.0,
        "velocity": {"x": 0, "y": 0, "z": 0},
        "parameters": {
            "radius": 1.0,
            "color": "#FF0000"
        }
    }

    response = requests.post(f"{BASE_URL}/physics-objects/", json=physics_object_data, headers=headers)
    assert response.status_code == 201, f"Physics object creation failed: {response.text}"

    physics_object = response.json()
    assert physics_object["name"] == physics_object_data["name"]
    assert physics_object["type"] == physics_object_data["type"]
    assert physics_object["universe_id"] == universe_id
    assert physics_object["scene_id"] == scene_id
    assert "user_id" in physics_object, "Physics object should have a user_id"

    # Test create with invalid data
    invalid_data = {
        "description": "Missing required fields"
    }

    response = requests.post(f"{BASE_URL}/physics-objects/", json=invalid_data, headers=headers)
    assert response.status_code == 400, "Should reject invalid physics object data"

def test_get_physics_objects():
    """Test getting all physics objects for a scene."""
    # Create a test physics object
    physics_object_id, universe_id, scene_id, headers, user_id = create_physics_object_helper()

    # Test get all physics objects
    response = requests.get(f"{BASE_URL}/physics-objects/?scene_id={scene_id}", headers=headers)
    assert response.status_code == 200, f"Get physics objects failed: {response.text}"

    physics_objects = response.json()
    assert isinstance(physics_objects, list), "Should return a list of physics objects"
    assert len(physics_objects) >= 1, "Should have at least one physics object"

    # Verify the created object is in the list
    found = False
    for obj in physics_objects:
        if obj["id"] == physics_object_id:
            found = True
            break

    assert found, "Created physics object should be in the list"

    # Test with invalid scene_id
    response = requests.get(f"{BASE_URL}/physics-objects/?scene_id=invalid-id", headers=headers)
    assert response.status_code == 400, "Should reject invalid scene_id"

def test_get_single_physics_object():
    """Test getting a single physics object."""
    # Create a test physics object
    physics_object_id, universe_id, scene_id, headers, user_id = create_physics_object_helper()

    print(f"\nDEBUG: physics_object_id={physics_object_id}, user_id={user_id}")
    print(f"DEBUG: headers={headers}")

    # Get the physics object details first to debug
    response = requests.get(f"{BASE_URL}/physics-objects/{physics_object_id}", headers=headers)
    print(f"DEBUG: Response status: {response.status_code}")
    print(f"DEBUG: Response body: {response.text}")

    # Test get single physics object
    assert response.status_code == 200, f"Get single physics object failed: {response.text}"

    physics_object = response.json()
    assert physics_object["id"] == physics_object_id, "Should return the correct physics object"

    # Print more details about the physics object
    print(f"DEBUG: Physics object: {physics_object}")
    print(f"DEBUG: Physics object user_id: {physics_object.get('user_id')}")
    print(f"DEBUG: Current user_id: {user_id}")

    # Test with invalid ID
    response = requests.get(f"{BASE_URL}/physics-objects/invalid-id", headers=headers)
    assert response.status_code == 400, "Should reject invalid physics object ID"

def test_update_physics_object():
    """Test updating a physics object."""
    # Create a test physics object
    physics_object_id, universe_id, scene_id, headers, user_id = create_physics_object_helper()

    print(f"\n\nDEBUG - test_update_physics_object:")
    print(f"physics_object_id: {physics_object_id}")
    print(f"user_id: {user_id}")
    print(f"headers: {headers}")

    # First get the physics object details
    response = requests.get(f"{BASE_URL}/physics-objects/{physics_object_id}", headers=headers)
    print(f"GET physics object status: {response.status_code}")
    if response.status_code == 200:
        physics_object = response.json()
        print(f"Physics Object: {physics_object}")
        print(f"Physics Object user_id: {physics_object.get('user_id')}")
        print(f"Physics Object creator: {physics_object.get('user_id')} vs Current user: {user_id}")

    # Test update physics object
    update_data = {
        "name": f"Updated Physics Object {uuid4().hex[:8]}",
        "position": {"x": 5, "y": 5, "z": 5},
        "mass": 2.0,
        "parameters": {
            "radius": 2.0,
            "color": "#00FF00"
        }
    }

    response = requests.put(f"{BASE_URL}/physics-objects/{physics_object_id}", json=update_data, headers=headers)
    print(f"PUT physics object status: {response.status_code}")
    print(f"PUT response: {response.text}")
    assert response.status_code == 200, f"Update physics object failed: {response.text}"

    updated_object = response.json()
    assert updated_object["name"] == update_data["name"], "Name should be updated"
    assert updated_object["position"]["x"] == update_data["position"]["x"], "Position should be updated"
    assert updated_object["mass"] == update_data["mass"], "Mass should be updated"
    assert updated_object["parameters"]["radius"] == update_data["parameters"]["radius"], "Parameters should be updated"

    # Test with invalid ID
    response = requests.put(f"{BASE_URL}/physics-objects/invalid-id", json=update_data, headers=headers)
    assert response.status_code == 400, "Should reject invalid physics object ID"

def test_delete_physics_object():
    """Test deleting a physics object."""
    # Create a test physics object
    physics_object_id, _, _, headers, user_id = create_physics_object_helper()

    # Test delete physics object
    response = requests.delete(f"{BASE_URL}/physics-objects/{physics_object_id}", headers=headers)
    assert response.status_code == 200, f"Delete physics object failed: {response.text}"

    # Verify it's deleted
    response = requests.get(f"{BASE_URL}/physics-objects/{physics_object_id}", headers=headers)
    assert response.status_code == 404, "Physics object should no longer exist"

    # Test with invalid ID
    response = requests.delete(f"{BASE_URL}/physics-objects/invalid-id", headers=headers)
    assert response.status_code == 400, "Should reject invalid physics object ID"
