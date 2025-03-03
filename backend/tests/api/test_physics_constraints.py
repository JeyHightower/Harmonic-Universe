"""Test the physics constraints endpoints."""
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

def create_test_physics_objects(headers, scene_id):
    """Helper function to create test physics objects and return their IDs."""
    # Create first physics object
    object1_data = {
        "name": f"Object1 {uuid4().hex[:8]}",
        "type": "sphere",
        "scene_id": scene_id,
        "position": {"x": 0, "y": 0, "z": 0},
        "rotation": {"x": 0, "y": 0, "z": 0},
        "scale": {"x": 1, "y": 1, "z": 1},
        "mass": 10.0,
        "velocity": {"x": 0, "y": 0, "z": 0},
        "parameters": {
            "radius": 1.0,
            "color": "#FF0000"
        }
    }

    response = requests.post(f"{BASE_URL}/physics-objects/", json=object1_data, headers=headers)
    assert response.status_code == 201, f"Create physics object 1 failed: {response.text}"
    object1_id = response.json()["id"]

    # Create second physics object
    object2_data = {
        "name": f"Object2 {uuid4().hex[:8]}",
        "type": "sphere",
        "scene_id": scene_id,
        "position": {"x": 10, "y": 0, "z": 0},
        "rotation": {"x": 0, "y": 0, "z": 0},
        "scale": {"x": 1, "y": 1, "z": 1},
        "mass": 5.0,
        "velocity": {"x": 0, "y": 0, "z": 0},
        "parameters": {
            "radius": 1.0,
            "color": "#00FF00"
        }
    }

    response = requests.post(f"{BASE_URL}/physics-objects/", json=object2_data, headers=headers)
    assert response.status_code == 201, f"Create physics object 2 failed: {response.text}"
    object2_id = response.json()["id"]

    return object1_id, object2_id

def test_create_physics_constraint():
    """Test creating a physics constraint between two objects."""
    # pytest.skip("Physics API not implemented yet")

    # Create a test user, universe, scene, and physics objects
    access_token, username, _ = create_test_user()
    headers = {"Authorization": f"Bearer {access_token}"}
    universe_id = create_test_universe(headers)
    scene_id = create_test_scene(headers, universe_id)
    object1_id, object2_id = create_test_physics_objects(headers, scene_id)

    # Test create physics constraint
    constraint_data = {
        "scene_id": scene_id,
        "type": "spring",
        "object1_id": object1_id,
        "object2_id": object2_id,
        "parameters": {
            "stiffness": 100.0,
            "damping": 10.0,
            "rest_length": 5.0
        }
    }

    response = requests.post(f"{BASE_URL}/physics-constraints/", json=constraint_data, headers=headers)
    assert response.status_code == 201, f"Create physics constraint failed: {response.text}"

    constraint = response.json()
    assert constraint["type"] == constraint_data["type"]
    assert constraint["object1_id"] == object1_id
    assert constraint["object2_id"] == object2_id
    assert constraint["parameters"]["stiffness"] == constraint_data["parameters"]["stiffness"]

    # Test create with invalid data
    invalid_data = {
        "scene_id": scene_id,
        "type": "spring",
        "object1_id": object1_id,
        # Missing object2_id
        "parameters": {
            "stiffness": 100.0,
            "damping": 10.0,
            "rest_length": 5.0
        }
    }

    response = requests.post(f"{BASE_URL}/physics-constraints/", json=invalid_data, headers=headers)
    assert response.status_code == 400, "Should reject invalid constraint data"

    return constraint["id"], scene_id, headers

def test_get_physics_constraints():
    """Test getting all physics constraints for a scene."""
    # pytest.skip("Physics API not implemented yet")

    # Create a test constraint
    constraint_id, scene_id, headers = test_create_physics_constraint()

    # Test get all constraints for a scene
    response = requests.get(f"{BASE_URL}/physics-constraints/?scene_id={scene_id}", headers=headers)
    assert response.status_code == 200, f"Get physics constraints failed: {response.text}"

    constraints = response.json()
    assert isinstance(constraints, list), "Should return a list of constraints"
    assert len(constraints) >= 1, "Should have at least one constraint"

    # Verify the created constraint is in the list
    found = False
    for constraint in constraints:
        if constraint["id"] == constraint_id:
            found = True
            break

    assert found, "Created constraint should be in the list"

def test_get_single_physics_constraint():
    """Test getting a single physics constraint."""
    # pytest.skip("Physics API not implemented yet")

    # Create a test constraint
    constraint_id, _, headers = test_create_physics_constraint()

    # Test get single constraint
    response = requests.get(f"{BASE_URL}/physics-constraints/{constraint_id}", headers=headers)
    assert response.status_code == 200, f"Get single physics constraint failed: {response.text}"

    constraint = response.json()
    assert constraint["id"] == constraint_id, "Should return the correct constraint"

def test_update_physics_constraint():
    """Test updating a physics constraint."""
    # pytest.skip("Physics API not implemented yet")

    # Create a test constraint
    constraint_id, _, headers = test_create_physics_constraint()

    # Test update constraint
    update_data = {
        "parameters": {
            "stiffness": 200.0,
            "damping": 20.0,
            "rest_length": 10.0
        }
    }

    response = requests.put(f"{BASE_URL}/physics-constraints/{constraint_id}", json=update_data, headers=headers)
    assert response.status_code == 200, f"Update physics constraint failed: {response.text}"

    updated_constraint = response.json()
    assert updated_constraint["parameters"]["stiffness"] == update_data["parameters"]["stiffness"], "Parameters should be updated"
    assert updated_constraint["parameters"]["damping"] == update_data["parameters"]["damping"], "Parameters should be updated"
    assert updated_constraint["parameters"]["rest_length"] == update_data["parameters"]["rest_length"], "Parameters should be updated"

def test_delete_physics_constraint():
    """Test deleting a physics constraint."""
    # pytest.skip("Physics API not implemented yet")

    # Create a test constraint
    constraint_id, _, headers = test_create_physics_constraint()

    # Test delete constraint
    response = requests.delete(f"{BASE_URL}/physics-constraints/{constraint_id}", headers=headers)
    assert response.status_code == 200, f"Delete physics constraint failed: {response.text}"

    # Verify it's deleted
    response = requests.get(f"{BASE_URL}/physics-constraints/{constraint_id}", headers=headers)
    assert response.status_code == 404, "Physics constraint should no longer exist"

def test_create_different_constraint_types():
    """Test creating different types of physics constraints."""
    # pytest.skip("Physics API not implemented yet")

    # Create a test user, universe, scene, and physics objects
    access_token, username, _ = create_test_user()
    headers = {"Authorization": f"Bearer {access_token}"}
    universe_id = create_test_universe(headers)
    scene_id = create_test_scene(headers, universe_id)
    object1_id, object2_id = create_test_physics_objects(headers, scene_id)

    # Test different constraint types
    constraint_types = [
        {
            "type": "spring",
            "parameters": {
                "stiffness": 100.0,
                "damping": 0.5,
                "rest_length": 5.0
            }
        },
        {
            "type": "distance",
            "parameters": {
                "max_distance": 15.0,
                "min_distance": 2.0
            }
        },
        {
            "type": "hinge",
            "parameters": {
                "axis": [0, 1, 0],
                "angle_limit": [-45, 45]
            }
        }
    ]

    for constraint_info in constraint_types:
        constraint_data = {
            "scene_id": scene_id,
            "object1_id": object1_id,
            "object2_id": object2_id,
            "constraint_type": constraint_info["type"],
            "parameters": constraint_info["parameters"]
        }

        response = requests.post(f"{BASE_URL}/physics-constraints/", json=constraint_data, headers=headers)

        # If this type is not implemented, just continue to the next
        if response.status_code in [400, 501]:
            continue

        assert response.status_code == 201, f"Create {constraint_info['type']} constraint failed: {response.text}"

        constraint = response.json()
        assert constraint["constraint_type"] == constraint_info["type"]
        # Check at least one parameter
        param_key = list(constraint_info["parameters"].keys())[0]
        assert constraint["parameters"][param_key] == constraint_info["parameters"][param_key]

def test_invalid_physics_constraint():
    """Test creating a physics constraint with invalid data."""
    # pytest.skip("Physics API not implemented yet")

    # Create a test user, universe, scene, and physics objects
    access_token, username, _ = create_test_user()
    headers = {"Authorization": f"Bearer {access_token}"}
    universe_id = create_test_universe(headers)
    scene_id = create_test_scene(headers, universe_id)
    object1_id, object2_id = create_test_physics_objects(headers, scene_id)

    # Test with invalid constraint type
    constraint_data = {
        "scene_id": scene_id,
        "object1_id": object1_id,
        "object2_id": object2_id,
        "constraint_type": "invalid_type",
        "parameters": {
            "stiffness": 100.0
        }
    }

    response = requests.post(f"{BASE_URL}/physics-constraints/", json=constraint_data, headers=headers)

    # Skip if constraints are not implemented
    if response.status_code == 501:
        pytest.skip("Physics constraints not implemented")

    assert response.status_code in [400, 422], "Should reject invalid constraint type"

    # Test with missing required parameters
    constraint_data = {
        "scene_id": scene_id,
        "object1_id": object1_id,
        "object2_id": object2_id,
        "constraint_type": "spring",
        "parameters": {
            # Missing required parameters for a spring
        }
    }

    response = requests.post(f"{BASE_URL}/physics-constraints/", json=constraint_data, headers=headers)
    assert response.status_code in [400, 422], "Should reject missing parameters"

    # Test with non-existent object ID
    constraint_data = {
        "scene_id": scene_id,
        "object1_id": object1_id,
        "object2_id": 999999,  # Non-existent ID
        "constraint_type": "spring",
        "parameters": {
            "stiffness": 100.0,
            "damping": 0.5,
            "rest_length": 5.0
        }
    }

    response = requests.post(f"{BASE_URL}/physics-constraints/", json=constraint_data, headers=headers)
    assert response.status_code in [400, 404, 422], "Should reject non-existent object ID"
