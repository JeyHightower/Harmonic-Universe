"""Tests for Storyboard API routes."""
import json
import pytest
from backend.app.models import Storyboard
from tests.factories import StoryboardFactory, UniverseFactory


def test_get_storyboards(client, universe, auth_headers):
    """Test getting all storyboards for a universe."""
    # Create some test storyboards
    storyboards = [StoryboardFactory(universe=universe) for _ in range(3)]

    # Create a storyboard in another universe (shouldn't be returned)
    other_universe = UniverseFactory()
    StoryboardFactory(universe=other_universe)

    response = client.get(
        f"/api/universes/{universe.id}/storyboards", headers=auth_headers
    )
    assert response.status_code == 200

    data = json.loads(response.data)
    assert len(data["storyboards"]) == 3
    assert all(sb["universe_id"] == universe.id for sb in data["storyboards"])


def test_get_storyboard(client, storyboard, auth_headers):
    """Test getting a specific storyboard."""
    response = client.get(
        f"/api/universes/{storyboard.universe.id}/storyboards/{storyboard.id}",
        headers=auth_headers,
    )
    assert response.status_code == 200

    data = json.loads(response.data)
    assert data["id"] == storyboard.id
    assert data["name"] == storyboard.name
    assert data["description"] == storyboard.description
    assert data["universe_id"] == storyboard.universe.id


def test_get_nonexistent_storyboard(client, universe, auth_headers):
    """Test getting a storyboard that doesn't exist."""
    response = client.get(
        f"/api/universes/{universe.id}/storyboards/999", headers=auth_headers
    )
    assert response.status_code == 404


def test_create_storyboard(client, universe, auth_headers):
    """Test creating a new storyboard."""
    data = {"name": "New Storyboard", "description": "A new test storyboard"}

    response = client.post(
        f"/api/universes/{universe.id}/storyboards",
        data=json.dumps(data),
        content_type="application/json",
        headers=auth_headers,
    )
    assert response.status_code == 201

    data = json.loads(response.data)
    assert data["name"] == "New Storyboard"
    assert data["description"] == "A new test storyboard"
    assert data["universe_id"] == universe.id


def test_create_storyboard_validation(client, universe, auth_headers):
    """Test storyboard creation validation."""
    # Test missing required field
    data = {"description": "Missing name"}
    response = client.post(
        f"/api/universes/{universe.id}/storyboards",
        data=json.dumps(data),
        content_type="application/json",
        headers=auth_headers,
    )
    assert response.status_code == 400


def test_update_storyboard(client, storyboard, auth_headers):
    """Test updating a storyboard."""
    data = {"name": "Updated Storyboard", "description": "An updated description"}

    response = client.put(
        f"/api/universes/{storyboard.universe.id}/storyboards/{storyboard.id}",
        data=json.dumps(data),
        content_type="application/json",
        headers=auth_headers,
    )
    assert response.status_code == 200

    data = json.loads(response.data)
    assert data["name"] == "Updated Storyboard"
    assert data["description"] == "An updated description"


def test_delete_storyboard(client, storyboard, auth_headers, session):
    """Test deleting a storyboard."""
    storyboard_id = storyboard.id
    response = client.delete(
        f"/api/universes/{storyboard.universe.id}/storyboards/{storyboard.id}",
        headers=auth_headers,
    )
    assert response.status_code == 204

    # Verify storyboard is deleted from database
    assert Storyboard.query.get(storyboard_id) is None


def test_unauthorized_access(client, storyboard):
    """Test unauthorized access to storyboard endpoints."""
    # Try without auth headers
    response = client.get(f"/api/universes/{storyboard.universe.id}/storyboards")
    assert response.status_code == 401

    # Try with invalid token
    invalid_headers = {"Authorization": "Bearer invalid_token"}
    response = client.get(
        f"/api/universes/{storyboard.universe.id}/storyboards", headers=invalid_headers
    )
    assert response.status_code == 422


def test_forbidden_access(client, storyboard):
    """Test forbidden access to another user's storyboard."""
    # Create a different user and get their auth token
    other_user = UserFactory()
    from flask_jwt_extended import create_access_token

    token = create_access_token(identity=other_user.id)
    headers = {"Authorization": f"Bearer {token}"}

    # Try to access storyboard owned by first user
    response = client.get(
        f"/api/universes/{storyboard.universe.id}/storyboards/{storyboard.id}",
        headers=headers,
    )
    assert response.status_code == 403


def test_reorder_scenes(client, storyboard, auth_headers):
    """Test reordering scenes in a storyboard."""
    # Create some scenes
    scenes = [SceneFactory(storyboard=storyboard) for _ in range(3)]

    # New order
    new_order = [
        {"id": scenes[2].id, "sequence": 0},
        {"id": scenes[0].id, "sequence": 1},
        {"id": scenes[1].id, "sequence": 2},
    ]

    response = client.put(
        f"/api/universes/{storyboard.universe.id}/storyboards/{storyboard.id}/reorder",
        data=json.dumps({"scenes": new_order}),
        content_type="application/json",
        headers=auth_headers,
    )
    assert response.status_code == 200

    # Verify new order
    data = json.loads(response.data)
    assert [scene["sequence"] for scene in data["scenes"]] == [0, 1, 2]
    assert [scene["id"] for scene in data["scenes"]] == [
        scenes[2].id,
        scenes[0].id,
        scenes[1].id,
    ]
