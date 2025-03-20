"""Tests for Scene API routes."""
import json
import pytest
from backend.app.models import Scene
from tests.factories import SceneFactory, StoryboardFactory


def test_get_scenes(client, storyboard, auth_headers):
    """Test getting all scenes for a storyboard."""
    # Create some test scenes
    scenes = [SceneFactory(storyboard=storyboard) for _ in range(3)]

    # Create a scene in another storyboard (shouldn't be returned)
    other_storyboard = StoryboardFactory(universe=storyboard.universe)
    SceneFactory(storyboard=other_storyboard)

    response = client.get(
        f"/api/universes/{storyboard.universe.id}/storyboards/{storyboard.id}/scenes",
        headers=auth_headers,
    )
    assert response.status_code == 200

    data = json.loads(response.data)
    assert len(data["scenes"]) == 3
    assert all(s["storyboard_id"] == storyboard.id for s in data["scenes"])
    # Verify scenes are ordered by sequence
    sequences = [s["sequence"] for s in data["scenes"]]
    assert sequences == sorted(sequences)


def test_get_scene(client, scene, auth_headers):
    """Test getting a specific scene."""
    response = client.get(
        f"/api/universes/{scene.storyboard.universe.id}/storyboards/{scene.storyboard.id}/scenes/{scene.id}",
        headers=auth_headers,
    )
    assert response.status_code == 200

    data = json.loads(response.data)
    assert data["id"] == scene.id
    assert data["name"] == scene.name
    assert data["description"] == scene.description
    assert data["sequence"] == scene.sequence
    assert data["content"] == scene.content
    assert data["storyboard_id"] == scene.storyboard.id


def test_get_nonexistent_scene(client, storyboard, auth_headers):
    """Test getting a scene that doesn't exist."""
    response = client.get(
        f"/api/universes/{storyboard.universe.id}/storyboards/{storyboard.id}/scenes/999",
        headers=auth_headers,
    )
    assert response.status_code == 404


def test_create_scene(client, storyboard, auth_headers):
    """Test creating a new scene."""
    data = {
        "name": "New Scene",
        "description": "A new test scene",
        "sequence": 0,
        "content": {"layout": "grid", "elements": []},
    }

    response = client.post(
        f"/api/universes/{storyboard.universe.id}/storyboards/{storyboard.id}/scenes",
        data=json.dumps(data),
        content_type="application/json",
        headers=auth_headers,
    )
    assert response.status_code == 201

    data = json.loads(response.data)
    assert data["name"] == "New Scene"
    assert data["description"] == "A new test scene"
    assert data["sequence"] == 0
    assert data["content"] == {"layout": "grid", "elements": []}
    assert data["storyboard_id"] == storyboard.id


def test_create_scene_validation(client, storyboard, auth_headers):
    """Test scene creation validation."""
    # Test missing required fields
    data = {"description": "Missing name and sequence"}
    response = client.post(
        f"/api/universes/{storyboard.universe.id}/storyboards/{storyboard.id}/scenes",
        data=json.dumps(data),
        content_type="application/json",
        headers=auth_headers,
    )
    assert response.status_code == 400

    # Test invalid content format
    data = {"name": "Test Scene", "sequence": 0, "content": "invalid json"}
    response = client.post(
        f"/api/universes/{storyboard.universe.id}/storyboards/{storyboard.id}/scenes",
        data=json.dumps(data),
        content_type="application/json",
        headers=auth_headers,
    )
    assert response.status_code == 400


def test_update_scene(client, scene, auth_headers):
    """Test updating a scene."""
    data = {
        "name": "Updated Scene",
        "description": "An updated description",
        "content": {"layout": "list", "elements": [1, 2, 3]},
    }

    response = client.put(
        f"/api/universes/{scene.storyboard.universe.id}/storyboards/{scene.storyboard.id}/scenes/{scene.id}",
        data=json.dumps(data),
        content_type="application/json",
        headers=auth_headers,
    )
    assert response.status_code == 200

    data = json.loads(response.data)
    assert data["name"] == "Updated Scene"
    assert data["description"] == "An updated description"
    assert data["content"] == {"layout": "list", "elements": [1, 2, 3]}


def test_delete_scene(client, scene, auth_headers, session):
    """Test deleting a scene."""
    scene_id = scene.id
    response = client.delete(
        f"/api/universes/{scene.storyboard.universe.id}/storyboards/{scene.storyboard.id}/scenes/{scene.id}",
        headers=auth_headers,
    )
    assert response.status_code == 204

    # Verify scene is deleted from database
    assert Scene.query.get(scene_id) is None


def test_unauthorized_access(client, scene):
    """Test unauthorized access to scene endpoints."""
    # Try without auth headers
    response = client.get(
        f"/api/universes/{scene.storyboard.universe.id}/storyboards/{scene.storyboard.id}/scenes"
    )
    assert response.status_code == 401

    # Try with invalid token
    invalid_headers = {"Authorization": "Bearer invalid_token"}
    response = client.get(
        f"/api/universes/{scene.storyboard.universe.id}/storyboards/{scene.storyboard.id}/scenes",
        headers=invalid_headers,
    )
    assert response.status_code == 422


def test_forbidden_access(client, scene):
    """Test forbidden access to another user's scene."""
    # Create a different user and get their auth token
    other_user = UserFactory()
    from flask_jwt_extended import create_access_token

    token = create_access_token(identity=other_user.id)
    headers = {"Authorization": f"Bearer {token}"}

    # Try to access scene owned by first user
    response = client.get(
        f"/api/universes/{scene.storyboard.universe.id}/storyboards/{scene.storyboard.id}/scenes/{scene.id}",
        headers=headers,
    )
    assert response.status_code == 403


def test_update_scene_sequence(client, storyboard, auth_headers):
    """Test updating a scene's sequence."""
    # Create some scenes
    scenes = [SceneFactory(storyboard=storyboard, sequence=i) for i in range(3)]

    # Update middle scene's sequence
    data = {"sequence": 2}
    response = client.patch(
        f"/api/universes/{storyboard.universe.id}/storyboards/{storyboard.id}/scenes/{scenes[1].id}/sequence",
        data=json.dumps(data),
        content_type="application/json",
        headers=auth_headers,
    )
    assert response.status_code == 200

    # Verify sequences were updated
    response = client.get(
        f"/api/universes/{storyboard.universe.id}/storyboards/{storyboard.id}/scenes",
        headers=auth_headers,
    )
    data = json.loads(response.data)
    sequences = [s["sequence"] for s in data["scenes"]]
    assert sequences == [0, 2, 1]  # Original scene 1 moved to end
