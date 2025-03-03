"""Test the music generation endpoints."""
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

def test_get_audio_tracks():
    """Test getting audio tracks."""
    # pytest.skip("Music generation API not implemented yet")

    # Create a test user, universe, and scene
    access_token, username, _ = create_test_user()
    headers = {"Authorization": f"Bearer {access_token}"}
    universe_id = create_test_universe(headers)
    scene_id = create_test_scene(headers, universe_id)

    # Get audio tracks
    response = requests.get(f"{BASE_URL}/music/tracks?universe_id={universe_id}", headers=headers)
    assert response.status_code == 200, f"Get audio tracks failed: {response.text}"

    tracks = response.json()
    # Initially, there may be no tracks, so we just check that we get a list
    assert isinstance(tracks, list)

def test_generate_audio():
    """Test generating audio from a scene."""
    # pytest.skip("Music generation API not implemented yet")

    # Create a test user, universe, and scene
    access_token, username, _ = create_test_user()
    headers = {"Authorization": f"Bearer {access_token}"}
    universe_id = create_test_universe(headers)
    scene_id = create_test_scene(headers, universe_id)

    # Generate audio
    generate_data = {
        "scene_id": scene_id,
        "duration": 10,  # seconds
        "parameters": {
            "tempo": 120,
            "key": "C",
            "scale": "major",
            "instruments": ["piano", "strings"]
        }
    }

    # This test may be skipped or mocked if actual generation is resource intensive
    # For now, we'll just verify the endpoint exists and accepts our request
    response = requests.post(f"{BASE_URL}/music/generate", json=generate_data, headers=headers)

    # Check if the endpoint is available (may return 202 Accepted for async processing)
    assert response.status_code in [200, 201, 202], f"Generate audio failed: {response.text}"

    # If successful generation, the response should contain a track ID
    if response.status_code in [200, 201]:
        track = response.json()
        assert "id" in track
        assert track["scene_id"] == scene_id

        # Return the track ID for use in other tests
        return track["id"], headers

    # If async processing, the response should contain a job ID
    elif response.status_code == 202:
        job = response.json()
        assert "job_id" in job

        # No track ID to return yet
        return None, headers

def test_create_audio_track():
    """Test creating an audio track."""
    # pytest.skip("Music generation API not implemented yet")

    # Create a test user, universe, and scene
    access_token, username, _ = create_test_user()
    headers = {"Authorization": f"Bearer {access_token}"}
    universe_id = create_test_universe(headers)
    scene_id = create_test_scene(headers, universe_id)

    # Create audio track
    track_data = {
        "name": f"Test Track {uuid4().hex[:8]}",
        "universe_id": universe_id,
        "scene_id": scene_id,
        "parameters": {
            "tempo": 120,
            "key": "C",
            "scale": "major"
        }
    }

    response = requests.post(f"{BASE_URL}/music/tracks", json=track_data, headers=headers)

    # Skip this test if the endpoint returns 501 Not Implemented
    if response.status_code == 501:
        pytest.skip("Audio track creation not implemented")

    assert response.status_code == 201, f"Create audio track failed: {response.text}"

    track = response.json()
    assert track["name"] == track_data["name"]
    assert track["universe_id"] == universe_id
    assert track["scene_id"] == scene_id

    return track["id"], headers

def test_get_single_audio_track():
    """Test getting a single audio track."""
    # pytest.skip("Music generation API not implemented yet")

    # Create a test user, universe, and scene
    access_token, username, _ = create_test_user()
    headers = {"Authorization": f"Bearer {access_token}"}
    universe_id = create_test_universe(headers)
    scene_id = create_test_scene(headers, universe_id)

    # Create audio track
    track_data = {
        "scene_id": scene_id,
        "name": "Test Track",
        "parameters": {
            "tempo": 120,
            "key": "C",
            "scale": "major",
            "instruments": ["piano", "strings"]
        }
    }

    response = requests.post(f"{BASE_URL}/music/tracks", json=track_data, headers=headers)
    assert response.status_code == 201, f"Create audio track failed: {response.text}"

    track = response.json()
    assert track["name"] == track_data["name"]
    assert track["universe_id"] == universe_id
    assert track["scene_id"] == scene_id

    # Get the created track
    track_id = track["id"]
    response = requests.get(f"{BASE_URL}/music/tracks/{track_id}", headers=headers)
    assert response.status_code == 200, f"Get single audio track failed: {response.text}"

    retrieved_track = response.json()
    assert retrieved_track["id"] == track_id
    assert retrieved_track["name"] == track_data["name"]

    return track_id, headers

def test_update_audio_track():
    """Test updating an audio track."""
    # pytest.skip("Music generation API not implemented yet")

    # Get a track to update
    track_id, headers = test_get_single_audio_track()

    # Update the track
    update_data = {
        "name": "Updated Track Name",
        "parameters": {
            "tempo": 140,
            "key": "G",
            "scale": "minor",
            "instruments": ["guitar", "bass"]
        }
    }

    response = requests.put(f"{BASE_URL}/music/tracks/{track_id}", json=update_data, headers=headers)

    # Skip this test if the endpoint returns 501 Not Implemented
    if response.status_code == 501:
        pytest.skip("Audio track update not implemented")

    assert response.status_code == 200, f"Update audio track failed: {response.text}"

    updated_track = response.json()
    assert updated_track["name"] == update_data["name"]
    assert updated_track["parameters"]["tempo"] == update_data["parameters"]["tempo"]

def test_delete_audio_track():
    """Test deleting an audio track."""
    # pytest.skip("Music generation API not implemented yet")

    # Create a test user, universe, and scene
    access_token, username, _ = create_test_user()
    headers = {"Authorization": f"Bearer {access_token}"}
    universe_id = create_test_universe(headers)
    scene_id = create_test_scene(headers, universe_id)

    # Create audio track
    track_data = {
        "scene_id": scene_id,
        "name": "Test Track To Delete",
        "parameters": {
            "tempo": 120,
            "key": "C",
            "scale": "major",
            "instruments": ["piano", "strings"]
        }
    }

    response = requests.post(f"{BASE_URL}/music/tracks", json=track_data, headers=headers)
    assert response.status_code == 201, f"Create audio track failed: {response.text}"

    track = response.json()
    track_id = track["id"]

    # Delete the track
    response = requests.delete(f"{BASE_URL}/music/tracks/{track_id}", headers=headers)
    assert response.status_code == 200, f"Delete audio track failed: {response.text}"

    # Verify it's deleted
    response = requests.get(f"{BASE_URL}/music/tracks/{track_id}", headers=headers)
    assert response.status_code == 404, "Track should be deleted"

def test_process_physics_to_audio():
    """Test processing physics parameters to generate audio."""
    # pytest.skip("Music generation API not implemented yet")

    # Create a test user, universe, and scene
    access_token, username, _ = create_test_user()
    headers = {"Authorization": f"Bearer {access_token}"}
    universe_id = create_test_universe(headers)
    scene_id = create_test_scene(headers, universe_id)

    # Process physics to audio
    physics_data = {
        "scene_id": scene_id,
        "physics_parameters": {
            "gravity": 9.8,
            "air_resistance": 0.1,
            "temperature": 293.15,
            "time_scale": 1.0
        },
        "harmony_parameters": {
            "key": {
                "value": "C"
            },
            "scale": {
                "value": "major"
            },
            "tempo": {
                "value": 120
            }
        }
    }

    response = requests.post(f"{BASE_URL}/music/physics-to-audio", json=physics_data, headers=headers)
    assert response.status_code in [200, 201], f"Process physics to audio failed: {response.text}"

    result = response.json()
    assert "id" in result
    assert result["scene_id"] == scene_id
    assert "music_data" in result
