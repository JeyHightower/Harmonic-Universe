import pytest
from app.models.universe import Universe
from app.models.storyboard import Storyboard
import json


@pytest.fixture
def auth_headers(client, test_user):
    # Login and get token
    response = client.post(
        "/api/auth/login",
        json={"email": test_user["email"], "password": test_user["password"]},
    )
    token = response.json["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def test_user():
    return {"username": "testuser", "email": "test@example.com", "password": "Test123!"}


@pytest.fixture
def test_universe():
    return {
        "name": "Test Universe",
        "description": "A test universe",
        "is_private": False,
        "parameters": {
            "gravity": 9.81,
            "friction": 0.5,
            "elasticity": 0.7,
            "air_resistance": 0.1,
        },
    }


def test_auth_flow(client, test_user):
    """Test the complete authentication flow."""
    # Test registration
    response = client.post("/api/auth/register", json=test_user)
    assert response.status_code == 201
    assert "access_token" in response.json

    # Test login
    response = client.post(
        "/api/auth/login",
        json={"email": test_user["email"], "password": test_user["password"]},
    )
    assert response.status_code == 200
    assert "access_token" in response.json

    # Test profile retrieval
    token = response.json["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/auth/profile", headers=headers)
    assert response.status_code == 200
    assert response.json["email"] == test_user["email"]


def test_universe_creation_with_parameters(client, auth_headers):
    """Test creating a universe with all parameter types."""
    universe_data = {
        "name": "Test Universe",
        "description": "A test universe",
        "is_public": True,
        "physics_params": {
            "gravity": 9.81,
            "friction": 0.5,
            "elasticity": 0.7,
            "air_resistance": 0.1,
        },
        "music_params": {
            "harmony": "major",
            "tempo": 120,
            "key": "C",
            "scale": "major",
        },
        "visual_params": {
            "color_scheme": "dark",
            "particle_size": 2.5,
            "trail_length": 50,
        },
    }

    # Create universe
    response = client.post("/api/universes", json=universe_data, headers=auth_headers)
    assert response.status_code == 201
    universe_id = response.json["id"]

    # Verify all parameters
    response = client.get(f"/api/universes/{universe_id}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json["physics_params"]["gravity"] == 9.81
    assert response.json["music_params"]["tempo"] == 120
    assert response.json["visual_params"]["color_scheme"] == "dark"


def test_parameter_updates(client, auth_headers):
    """Test updating different parameter types."""
    # Create basic universe first
    universe_data = {
        "name": "Parameter Test Universe",
        "description": "Testing parameter updates",
        "is_public": True,
    }
    response = client.post("/api/universes", json=universe_data, headers=auth_headers)
    universe_id = response.json["id"]

    # Test physics parameter update
    physics_update = {
        "gravity": 5.0,
        "friction": 0.3,
        "elasticity": 0.8,
        "air_resistance": 0.2,
    }
    response = client.put(
        f"/api/universes/{universe_id}/parameters/physics",
        json=physics_update,
        headers=auth_headers,
    )
    assert response.status_code == 200

    # Test music parameter update
    music_update = {
        "harmony": "minor",
        "tempo": 140,
        "key": "Am",
        "scale": "minor",
    }
    response = client.put(
        f"/api/universes/{universe_id}/parameters/music",
        json=music_update,
        headers=auth_headers,
    )
    assert response.status_code == 200

    # Test visual parameter update
    visual_update = {
        "color_scheme": "light",
        "particle_size": 3.0,
        "trail_length": 75,
    }
    response = client.put(
        f"/api/universes/{universe_id}/parameters/visual",
        json=visual_update,
        headers=auth_headers,
    )
    assert response.status_code == 200

    # Verify all updates
    response = client.get(f"/api/universes/{universe_id}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json["physics_params"]["gravity"] == 5.0
    assert response.json["music_params"]["tempo"] == 140
    assert response.json["visual_params"]["color_scheme"] == "light"


def test_storyboard_management(client, auth_headers):
    """Test storyboard creation and management."""
    # Create universe first
    universe_data = {
        "name": "Storyboard Test Universe",
        "description": "Testing storyboard features",
        "is_public": True,
    }
    response = client.post("/api/universes", json=universe_data, headers=auth_headers)
    universe_id = response.json["id"]

    # Create storyboard entry
    storyboard_data = {
        "universe_id": universe_id,
        "title": "Chapter 1",
        "description": "The beginning",
        "harmony_value": 0.7,
        "sequence_number": 1,
    }
    response = client.post("/api/storyboards", json=storyboard_data, headers=auth_headers)
    assert response.status_code == 201
    storyboard_id = response.json["id"]

    # Update storyboard
    update_data = {
        "title": "Chapter 1: The New Beginning",
        "harmony_value": 0.8,
    }
    response = client.put(
        f"/api/storyboards/{storyboard_id}",
        json=update_data,
        headers=auth_headers,
    )
    assert response.status_code == 200

    # Get storyboard
    response = client.get(f"/api/storyboards/{storyboard_id}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json["title"] == "Chapter 1: The New Beginning"
    assert response.json["harmony_value"] == 0.8

    # Delete storyboard
    response = client.delete(f"/api/storyboards/{storyboard_id}", headers=auth_headers)
    assert response.status_code == 204


def test_universe_export(client, auth_headers):
    """Test exporting universe configuration."""
    # Create universe with all parameters
    universe_data = {
        "name": "Export Test Universe",
        "description": "Testing export feature",
        "is_public": True,
        "physics_params": {
            "gravity": 9.81,
            "friction": 0.5,
            "elasticity": 0.7,
            "air_resistance": 0.1,
        },
        "music_params": {
            "harmony": "major",
            "tempo": 120,
            "key": "C",
            "scale": "major",
        },
        "visual_params": {
            "color_scheme": "dark",
            "particle_size": 2.5,
            "trail_length": 50,
        },
    }
    response = client.post("/api/universes", json=universe_data, headers=auth_headers)
    universe_id = response.json["id"]

    # Export universe
    response = client.get(
        f"/api/universes/{universe_id}/export",
        headers=auth_headers,
    )
    assert response.status_code == 200
    export_data = response.json

    # Verify export data
    assert export_data["name"] == universe_data["name"]
    assert export_data["physics_params"] == universe_data["physics_params"]
    assert export_data["music_params"] == universe_data["music_params"]
    assert export_data["visual_params"] == universe_data["visual_params"]
    assert "exported_at" in export_data


@pytest.mark.comprehensive
def test_complete_flow(client, auth_headers):
    """Test the complete flow of the application."""
    # 1. Create universe with all parameters
    universe_data = {
        "name": "Complete Test Universe",
        "description": "Testing everything",
        "is_public": True,
        "physics_params": {
            "gravity": 9.81,
            "friction": 0.5,
            "elasticity": 0.7,
            "air_resistance": 0.1,
        },
        "music_params": {
            "harmony": "major",
            "tempo": 120,
            "key": "C",
            "scale": "major",
        },
        "visual_params": {
            "color_scheme": "dark",
            "particle_size": 2.5,
            "trail_length": 50,
        },
    }
    response = client.post("/api/universes", json=universe_data, headers=auth_headers)
    assert response.status_code == 201
    universe_id = response.json["id"]

    # 2. Add storyboard entries
    storyboard_entries = [
        {
            "universe_id": universe_id,
            "title": f"Chapter {i}",
            "description": f"Chapter {i} description",
            "harmony_value": i / 10,
            "sequence_number": i,
        }
        for i in range(1, 4)
    ]
    for entry in storyboard_entries:
        response = client.post("/api/storyboards", json=entry, headers=auth_headers)
        assert response.status_code == 201

    # 3. Update parameters
    updates = {
        "physics": {
            "gravity": 5.0,
            "friction": 0.3,
            "elasticity": 0.8,
            "air_resistance": 0.2,
        },
        "music": {
            "harmony": "minor",
            "tempo": 140,
            "key": "Am",
            "scale": "minor",
        },
        "visual": {
            "color_scheme": "light",
            "particle_size": 3.0,
            "trail_length": 75,
        },
    }

    for param_type, params in updates.items():
        response = client.put(
            f"/api/universes/{universe_id}/parameters/{param_type}",
            json=params,
            headers=auth_headers,
        )
        assert response.status_code == 200

    # 4. Export universe
    response = client.get(
        f"/api/universes/{universe_id}/export",
        headers=auth_headers,
    )
    assert response.status_code == 200
    export_data = response.json

    # 5. Verify final state
    response = client.get(f"/api/universes/{universe_id}", headers=auth_headers)
    assert response.status_code == 200
    final_state = response.json

    assert final_state["physics_params"] == updates["physics"]
    assert final_state["music_params"] == updates["music"]
    assert final_state["visual_params"] == updates["visual"]

    # 6. Clean up
    response = client.delete(f"/api/universes/{universe_id}", headers=auth_headers)
    assert response.status_code == 204
