"""Test the visualization endpoints."""
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

def test_create_visualization():
    """Test creating a visualization for a scene."""
    # Create a test user, universe, and scene
    access_token, username, _ = create_test_user()
    headers = {"Authorization": f"Bearer {access_token}"}
    universe_id = create_test_universe(headers)
    scene_id = create_test_scene(headers, universe_id)

    # Create visualization
    viz_data = {
        "scene_id": scene_id,
        "name": f"Test Visualization {uuid4().hex[:8]}",
        "type": "particle_system",
        "settings": {
            "background_color": "#000000",
            "particle_color": "#FFFFFF",
            "particle_size": 2.0,
            "max_particles": 1000,
            "particle_speed": 1.0
        }
    }

    response = requests.post(f"{BASE_URL}/visualizations/", json=viz_data, headers=headers)

    # Skip if this endpoint is not implemented
    if response.status_code == 501:
        pytest.skip("Visualization creation not implemented")

    assert response.status_code == 201, f"Create visualization failed: {response.text}"

    viz = response.json()
    assert viz["scene_id"] == scene_id
    assert viz["name"] == viz_data["name"]
    assert viz["type"] == viz_data["type"]
    assert "settings" in viz

    return viz["id"], headers, scene_id

def test_get_visualizations_by_scene():
    """Test getting all visualizations for a scene."""
    # Create a test user, universe, and scene
    access_token, username, _ = create_test_user()
    headers = {"Authorization": f"Bearer {access_token}"}
    universe_id = create_test_universe(headers)
    scene_id = create_test_scene(headers, universe_id)

    # Create multiple visualizations
    viz_types = ["particle_system", "waveform", "spectrum"]
    for viz_type in viz_types:
        viz_data = {
            "scene_id": scene_id,
            "name": f"Test {viz_type.capitalize()} {uuid4().hex[:8]}",
            "type": viz_type,
            "settings": {
                "background_color": "#000000",
                "particle_color": "#FFFFFF" if viz_type == "particle_system" else None,
                "particle_size": 2.0 if viz_type == "particle_system" else None,
                "max_particles": 1000 if viz_type == "particle_system" else None,
                "particle_speed": 1.0 if viz_type == "particle_system" else None,
                "waveform_color": "#00FF00" if viz_type == "waveform" else None,
                "waveform_thickness": 2.0 if viz_type == "waveform" else None,
                "spectrum_color_start": "#FF0000" if viz_type == "spectrum" else None,
                "spectrum_color_end": "#0000FF" if viz_type == "spectrum" else None,
                "bar_width": 5 if viz_type == "spectrum" else None,
                "bar_spacing": 2 if viz_type == "spectrum" else None
            }
        }
        response = requests.post(f"{BASE_URL}/visualizations/", json=viz_data, headers=headers)

        # Skip if this endpoint is not implemented
        if response.status_code == 501:
            pytest.skip("Visualization creation not implemented")

        assert response.status_code == 201, f"Create visualization failed: {response.text}"

    # Get all visualizations for the scene
    response = requests.get(f"{BASE_URL}/visualizations/scenes/{scene_id}/visualizations", headers=headers)

    # Skip if this endpoint is not implemented
    if response.status_code == 501:
        pytest.skip("Get visualizations endpoint not implemented")

    assert response.status_code == 200, f"Get visualizations failed: {response.text}"

    visualizations = response.json()
    assert len(visualizations) == 3, f"Expected 3 visualizations, got {len(visualizations)}"

    # Verify all visualization types are present
    viz_types_found = [viz["type"] for viz in visualizations]
    for viz_type in viz_types:
        assert viz_type in viz_types_found, f"Visualization type {viz_type} not found in response"

def test_get_single_visualization():
    """Test getting a single visualization."""
    # Create a test user, universe, scene, and visualization
    access_token, username, _ = create_test_user()
    headers = {"Authorization": f"Bearer {access_token}"}
    universe_id = create_test_universe(headers)
    scene_id = create_test_scene(headers, universe_id)

    # Create a visualization
    viz_data = {
        "scene_id": scene_id,
        "name": f"Test Visualization {uuid4().hex[:8]}",
        "type": "particle_system",
        "settings": {
            "background_color": "#000000",
            "particle_color": "#FFFFFF",
            "particle_size": 2.0,
            "max_particles": 1000,
            "particle_speed": 1.0
        }
    }

    response = requests.post(f"{BASE_URL}/visualizations/", json=viz_data, headers=headers)

    # Skip if this endpoint is not implemented
    if response.status_code == 501:
        pytest.skip("Visualization creation not implemented")

    assert response.status_code == 201, f"Create visualization failed: {response.text}"

    viz_id = response.json()["id"]

    # Get the visualization
    response = requests.get(f"{BASE_URL}/visualizations/{viz_id}", headers=headers)

    # Skip if this endpoint is not implemented
    if response.status_code == 501:
        pytest.skip("Get visualization endpoint not implemented")

    assert response.status_code == 200, f"Get visualization failed: {response.text}"

    viz = response.json()
    assert viz["id"] == viz_id
    assert viz["scene_id"] == scene_id
    assert viz["name"] == viz_data["name"]
    assert viz["type"] == viz_data["type"]

    # Test getting a non-existent visualization
    response = requests.get(f"{BASE_URL}/visualizations/{uuid4()}", headers=headers)
    assert response.status_code == 404, f"Expected 404 for non-existent visualization, got {response.status_code}"

def test_update_visualization():
    """Test updating a visualization."""
    # Create a test user, universe, scene, and visualization
    access_token, username, _ = create_test_user()
    headers = {"Authorization": f"Bearer {access_token}"}
    universe_id = create_test_universe(headers)
    scene_id = create_test_scene(headers, universe_id)

    # Create a visualization
    viz_data = {
        "scene_id": scene_id,
        "name": f"Test Visualization {uuid4().hex[:8]}",
        "type": "particle_system",
        "settings": {
            "background_color": "#000000",
            "particle_color": "#FFFFFF",
            "particle_size": 2.0,
            "max_particles": 1000,
            "particle_speed": 1.0
        }
    }

    response = requests.post(f"{BASE_URL}/visualizations/", json=viz_data, headers=headers)

    # Skip if this endpoint is not implemented
    if response.status_code == 501:
        pytest.skip("Visualization creation not implemented")

    assert response.status_code == 201, f"Create visualization failed: {response.text}"

    viz_id = response.json()["id"]

    # Update the visualization
    update_data = {
        "name": f"Updated Visualization {uuid4().hex[:8]}",
        "settings": {
            "background_color": "#111111",
            "particle_color": "#EEEEEE",
            "particle_size": 3.0,
            "max_particles": 2000,
            "particle_speed": 2.0
        }
    }

    response = requests.put(f"{BASE_URL}/visualizations/{viz_id}", json=update_data, headers=headers)

    # Skip if this endpoint is not implemented
    if response.status_code == 501:
        pytest.skip("Update visualization endpoint not implemented")

    assert response.status_code == 200, f"Update visualization failed: {response.text}"

    viz = response.json()
    assert viz["id"] == viz_id
    assert viz["name"] == update_data["name"]
    assert viz["settings"]["background_color"] == update_data["settings"]["background_color"]
    assert viz["settings"]["particle_color"] == update_data["settings"]["particle_color"]
    assert viz["settings"]["particle_size"] == update_data["settings"]["particle_size"]
    assert viz["settings"]["max_particles"] == update_data["settings"]["max_particles"]
    assert viz["settings"]["particle_speed"] == update_data["settings"]["particle_speed"]

    # Test updating a non-existent visualization
    response = requests.put(f"{BASE_URL}/visualizations/{uuid4()}", json=update_data, headers=headers)
    assert response.status_code == 404, f"Expected 404 for non-existent visualization, got {response.status_code}"

def test_partial_update_visualization():
    """Test partially updating a visualization."""
    # Create a test user, universe, scene, and visualization
    access_token, username, _ = create_test_user()
    headers = {"Authorization": f"Bearer {access_token}"}
    universe_id = create_test_universe(headers)
    scene_id = create_test_scene(headers, universe_id)

    # Create a visualization
    viz_data = {
        "scene_id": scene_id,
        "name": f"Test Visualization {uuid4().hex[:8]}",
        "type": "particle_system",
        "settings": {
            "background_color": "#000000",
            "particle_color": "#FFFFFF",
            "particle_size": 2.0,
            "max_particles": 1000,
            "particle_speed": 1.0
        }
    }

    response = requests.post(f"{BASE_URL}/visualizations/", json=viz_data, headers=headers)

    # Skip if this endpoint is not implemented
    if response.status_code == 501:
        pytest.skip("Visualization creation not implemented")

    assert response.status_code == 201, f"Create visualization failed: {response.text}"

    viz_id = response.json()["id"]
    original_viz = response.json()

    # Partially update the visualization - just the name
    update_data = {
        "name": f"Partially Updated Visualization {uuid4().hex[:8]}"
    }

    response = requests.patch(f"{BASE_URL}/visualizations/{viz_id}", json=update_data, headers=headers)

    # Skip if this endpoint is not implemented
    if response.status_code == 501:
        pytest.skip("Partial update visualization endpoint not implemented")

    assert response.status_code == 200, f"Partial update visualization failed: {response.text}"

    viz = response.json()
    assert viz["id"] == viz_id
    assert viz["name"] == update_data["name"]
    assert viz["settings"] == original_viz["settings"]  # Settings should be unchanged

    # Partially update just the settings
    update_data = {
        "settings": {
            "background_color": "#222222",
            "particle_color": "#DDDDDD"
        }
    }

    response = requests.patch(f"{BASE_URL}/visualizations/{viz_id}", json=update_data, headers=headers)
    assert response.status_code == 200, f"Partial update visualization failed: {response.text}"

    viz = response.json()
    assert viz["settings"]["background_color"] == update_data["settings"]["background_color"]
    assert viz["settings"]["particle_color"] == update_data["settings"]["particle_color"]
    assert viz["settings"]["particle_size"] == original_viz["settings"]["particle_size"]  # Should be unchanged
    assert viz["settings"]["max_particles"] == original_viz["settings"]["max_particles"]  # Should be unchanged
    assert viz["settings"]["particle_speed"] == original_viz["settings"]["particle_speed"]  # Should be unchanged

    # Test updating a non-existent visualization
    response = requests.patch(f"{BASE_URL}/visualizations/{uuid4()}", json=update_data, headers=headers)
    assert response.status_code == 404, f"Expected 404 for non-existent visualization, got {response.status_code}"

def test_delete_visualization():
    """Test deleting a visualization."""
    # Create a test user, universe, scene, and visualization
    access_token, username, _ = create_test_user()
    headers = {"Authorization": f"Bearer {access_token}"}
    universe_id = create_test_universe(headers)
    scene_id = create_test_scene(headers, universe_id)

    # Create a visualization
    viz_data = {
        "scene_id": scene_id,
        "name": f"Test Visualization {uuid4().hex[:8]}",
        "type": "particle_system",
        "settings": {
            "background_color": "#000000",
            "particle_color": "#FFFFFF",
            "particle_size": 2.0,
            "max_particles": 1000,
            "particle_speed": 1.0
        }
    }

    response = requests.post(f"{BASE_URL}/visualizations/", json=viz_data, headers=headers)

    # Skip if this endpoint is not implemented
    if response.status_code == 501:
        pytest.skip("Visualization creation not implemented")

    assert response.status_code == 201, f"Create visualization failed: {response.text}"

    viz_id = response.json()["id"]

    # Delete the visualization
    response = requests.delete(f"{BASE_URL}/visualizations/{viz_id}", headers=headers)

    # Skip if this endpoint is not implemented
    if response.status_code == 501:
        pytest.skip("Delete visualization endpoint not implemented")

    assert response.status_code in [200, 204], f"Delete visualization failed: {response.text}"

    # Verify the visualization is gone
    response = requests.get(f"{BASE_URL}/visualizations/{viz_id}", headers=headers)
    assert response.status_code == 404, f"Expected 404 for deleted visualization, got {response.status_code}"

    # Test deleting a non-existent visualization
    response = requests.delete(f"{BASE_URL}/visualizations/{uuid4()}", headers=headers)
    assert response.status_code == 404, f"Expected 404 for non-existent visualization, got {response.status_code}"

def test_create_different_visualization_types():
    """Test creating different types of visualizations."""
    # Create a test user, universe, and scene
    access_token, username, _ = create_test_user()
    headers = {"Authorization": f"Bearer {access_token}"}
    universe_id = create_test_universe(headers)
    scene_id = create_test_scene(headers, universe_id)

    # Test creating a particle system visualization
    particle_viz_data = {
        "scene_id": scene_id,
        "name": f"Particle System {uuid4().hex[:8]}",
        "type": "particle_system",
        "settings": {
            "background_color": "#000000",
            "particle_color": "#FFFFFF",
            "particle_size": 2.0,
            "max_particles": 1000,
            "particle_speed": 1.0
        }
    }

    response = requests.post(f"{BASE_URL}/visualizations/", json=particle_viz_data, headers=headers)

    # Skip if this endpoint is not implemented
    if response.status_code == 501:
        pytest.skip("Visualization creation not implemented")

    assert response.status_code == 201, f"Create particle visualization failed: {response.text}"

    # Test creating a waveform visualization
    waveform_viz_data = {
        "scene_id": scene_id,
        "name": f"Waveform {uuid4().hex[:8]}",
        "type": "waveform",
        "settings": {
            "background_color": "#000000",
            "waveform_color": "#00FF00",
            "waveform_thickness": 2.0
        }
    }

    response = requests.post(f"{BASE_URL}/visualizations/", json=waveform_viz_data, headers=headers)
    assert response.status_code == 201, f"Create waveform visualization failed: {response.text}"

    # Test creating a spectrum visualization
    spectrum_viz_data = {
        "scene_id": scene_id,
        "name": f"Spectrum {uuid4().hex[:8]}",
        "type": "spectrum",
        "settings": {
            "background_color": "#000000",
            "spectrum_color_start": "#FF0000",
            "spectrum_color_end": "#0000FF",
            "bar_width": 5,
            "bar_spacing": 2
        }
    }

    response = requests.post(f"{BASE_URL}/visualizations/", json=spectrum_viz_data, headers=headers)
    assert response.status_code == 201, f"Create spectrum visualization failed: {response.text}"

    # Test creating an invalid visualization type
    invalid_viz_data = {
        "scene_id": scene_id,
        "name": f"Invalid {uuid4().hex[:8]}",
        "type": "invalid_type",
        "settings": {
            "background_color": "#000000"
        }
    }

    response = requests.post(f"{BASE_URL}/visualizations/", json=invalid_viz_data, headers=headers)
    assert response.status_code in [400, 422], f"Expected 400 or 422 for invalid visualization type, got {response.status_code}"

def test_create_with_invalid_data():
    """Test creating a visualization with invalid data."""
    # Create a test user, universe, and scene
    access_token, username, _ = create_test_user()
    headers = {"Authorization": f"Bearer {access_token}"}
    universe_id = create_test_universe(headers)
    scene_id = create_test_scene(headers, universe_id)

    # Test missing required fields
    missing_fields_data = {
        "scene_id": scene_id,
        # Missing name
        "type": "particle_system",
        "settings": {
            "background_color": "#000000",
            "particle_color": "#FFFFFF",
            "particle_size": 2.0,
            "max_particles": 1000,
            "particle_speed": 1.0
        }
    }

    response = requests.post(f"{BASE_URL}/visualizations/", json=missing_fields_data, headers=headers)

    # Skip if this endpoint is not implemented
    if response.status_code == 501:
        pytest.skip("Visualization creation not implemented")

    assert response.status_code in [400, 422], f"Expected 400 or 422 for missing fields, got {response.status_code}"

    # Test invalid scene ID
    invalid_scene_data = {
        "scene_id": str(uuid4()),  # Non-existent scene ID
        "name": f"Invalid Scene {uuid4().hex[:8]}",
        "type": "particle_system",
        "settings": {
            "background_color": "#000000",
            "particle_color": "#FFFFFF",
            "particle_size": 2.0,
            "max_particles": 1000,
            "particle_speed": 1.0
        }
    }

    response = requests.post(f"{BASE_URL}/visualizations/", json=invalid_scene_data, headers=headers)
    assert response.status_code in [400, 404, 422], f"Expected 400, 404, or 422 for invalid scene ID, got {response.status_code}"

    # Test invalid settings for visualization type
    invalid_settings_data = {
        "scene_id": scene_id,
        "name": f"Invalid Settings {uuid4().hex[:8]}",
        "type": "particle_system",
        "settings": {
            "background_color": "#000000",
            # Missing particle_color and other required settings for particle_system
            "waveform_color": "#00FF00"  # This is for waveform type, not particle_system
        }
    }

    response = requests.post(f"{BASE_URL}/visualizations/", json=invalid_settings_data, headers=headers)
    assert response.status_code in [400, 422], f"Expected 400 or 422 for invalid settings, got {response.status_code}"

    # Test invalid color format
    invalid_color_data = {
        "scene_id": scene_id,
        "name": f"Invalid Color {uuid4().hex[:8]}",
        "type": "particle_system",
        "settings": {
            "background_color": "not-a-color",  # Invalid color format
            "particle_color": "#FFFFFF",
            "particle_size": 2.0,
            "max_particles": 1000,
            "particle_speed": 1.0
        }
    }

    response = requests.post(f"{BASE_URL}/visualizations/", json=invalid_color_data, headers=headers)
    assert response.status_code in [400, 422], f"Expected 400 or 422 for invalid color format, got {response.status_code}"

def test_generate_visualization():
    """Test generating a visualization from audio data."""
    # Create a test user, universe, scene, and visualization
    access_token, username, _ = create_test_user()
    headers = {"Authorization": f"Bearer {access_token}"}
    universe_id = create_test_universe(headers)
    scene_id = create_test_scene(headers, universe_id)

    # Create a visualization
    viz_data = {
        "scene_id": scene_id,
        "name": f"Test Visualization {uuid4().hex[:8]}",
        "type": "particle_system",
        "settings": {
            "background_color": "#000000",
            "particle_color": "#FFFFFF",
            "particle_size": 2.0,
            "max_particles": 1000,
            "particle_speed": 1.0
        }
    }

    response = requests.post(f"{BASE_URL}/visualizations/", json=viz_data, headers=headers)

    # Skip if this endpoint is not implemented
    if response.status_code == 501:
        pytest.skip("Visualization creation not implemented")

    assert response.status_code == 201, f"Create visualization failed: {response.text}"

    viz_id = response.json()["id"]

    # Generate visualization from audio data
    generate_data = {
        "audio_data": "SGVsbG8gV29ybGQ=",  # Valid base64 encoded string for "Hello World"
        "duration": 10.0,  # Duration in seconds
        "frame_rate": 30  # Frames per second
    }

    response = requests.post(f"{BASE_URL}/visualizations/{viz_id}/generate", json=generate_data, headers=headers)

    # Skip if this endpoint is not implemented
    if response.status_code == 501:
        pytest.skip("Generate visualization endpoint not implemented")

    assert response.status_code == 200, f"Generate visualization failed: {response.text}"

    result = response.json()
    assert "frames" in result, "Response should contain frames data"
    assert len(result["frames"]) > 0, "Frames data should not be empty"

    # Test with invalid audio data
    invalid_generate_data = {
        "audio_data": "invalid_base64_data",
        "duration": 10.0,
        "frame_rate": 30
    }

    response = requests.post(f"{BASE_URL}/visualizations/{viz_id}/generate", json=invalid_generate_data, headers=headers)
    assert response.status_code in [400, 422], f"Expected 400 or 422 for invalid audio data, got {response.status_code}"

    # Test with non-existent visualization ID
    non_existent_viz_id = str(uuid4())
    response = requests.post(f"{BASE_URL}/visualizations/{non_existent_viz_id}/generate", json=generate_data, headers=headers)
    assert response.status_code == 404, f"Expected 404 for non-existent visualization, got {response.status_code}"
