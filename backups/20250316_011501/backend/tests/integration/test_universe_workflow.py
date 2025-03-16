import pytest
from app.models import Universe, Scene, Storyboard


def test_universe_creation_workflow(client, auth_headers):
    """Test the complete workflow of creating and managing a universe"""

    # Create a new universe
    universe_data = {
        "name": "Test Universe",
        "description": "A test universe for integration testing",
    }
    response = client.post("/api/universes", json=universe_data, headers=auth_headers)
    assert response.status_code == 201
    universe_id = response.json["id"]

    # Add a scene to the universe
    scene_data = {
        "name": "Test Scene",
        "description": "A test scene",
        "universe_id": universe_id,
    }
    response = client.post("/api/scenes", json=scene_data, headers=auth_headers)
    assert response.status_code == 201
    scene_id = response.json["id"]

    # Create a storyboard
    storyboard_data = {
        "name": "Test Storyboard",
        "description": "A test storyboard",
        "universe_id": universe_id,
    }
    response = client.post(
        "/api/storyboards", json=storyboard_data, headers=auth_headers
    )
    assert response.status_code == 201

    # Verify the relationships
    response = client.get(f"/api/universes/{universe_id}", headers=auth_headers)
    assert response.status_code == 200
    universe = response.json

    assert len(universe["scenes"]) == 1
    assert len(universe["storyboards"]) == 1
    assert universe["scenes"][0]["id"] == scene_id
