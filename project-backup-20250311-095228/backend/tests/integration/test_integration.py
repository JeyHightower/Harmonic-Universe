"""Test suite for integration testing."""
import pytest
from app.models import User, Universe, Storyboard, Scene, PhysicsObject
from .factories import (
    UserFactory,
    UniverseFactory,
    StoryboardFactory,
    SceneFactory,
    PhysicsObjectFactory,
)


def test_complete_universe_workflow(client, auth_headers):
    """Test complete universe creation and management workflow."""
    # Create universe
    universe_response = client.post(
        "/api/universes",
        json={
            "name": "Test Universe",
            "description": "Integration test universe",
            "is_public": True,
        },
        headers=auth_headers,
    )
    assert universe_response.status_code == 201
    universe_id = universe_response.json["id"]

    # Create storyboard
    storyboard_response = client.post(
        f"/api/universes/{universe_id}/storyboards",
        json={"name": "Test Storyboard", "description": "Integration test storyboard"},
        headers=auth_headers,
    )
    assert storyboard_response.status_code == 201
    storyboard_id = storyboard_response.json["id"]

    # Create scene
    scene_response = client.post(
        f"/api/storyboards/{storyboard_id}/scenes",
        json={
            "name": "Test Scene",
            "description": "Integration test scene",
            "sequence": 1,
            "physics_settings": {"gravity": {"x": 0, "y": -9.81}, "enabled": True},
        },
        headers=auth_headers,
    )
    assert scene_response.status_code == 201
    scene_id = scene_response.json["id"]

    # Add physics object
    object_response = client.post(
        f"/api/scenes/{scene_id}/physics-objects",
        json={
            "name": "Test Object",
            "object_type": "circle",
            "position": {"x": 0, "y": 0},
            "dimensions": {"radius": 25},
        },
        headers=auth_headers,
    )
    assert object_response.status_code == 201

    # Verify complete structure
    universe_get = client.get(f"/api/universes/{universe_id}", headers=auth_headers)
    assert universe_get.status_code == 200
    assert "storyboards" in universe_get.json
    assert len(universe_get.json["storyboards"]) == 1


def test_user_collaboration_flow(client):
    """Test user collaboration workflow."""
    # Create users
    owner = UserFactory()
    collaborator = UserFactory()

    owner_headers = {"Authorization": f"Bearer {owner.generate_auth_token()}"}
    collaborator_headers = {
        "Authorization": f"Bearer {collaborator.generate_auth_token()}"
    }

    # Owner creates universe
    universe_response = client.post(
        "/api/universes", json={"name": "Collaborative Universe"}, headers=owner_headers
    )
    universe_id = universe_response.json["id"]

    # Owner invites collaborator
    invite_response = client.post(
        f"/api/universes/{universe_id}/collaborators",
        json={"user_id": collaborator.id, "role": "editor"},
        headers=owner_headers,
    )
    assert invite_response.status_code == 201

    # Collaborator edits universe
    edit_response = client.put(
        f"/api/universes/{universe_id}",
        json={"description": "Edited by collaborator"},
        headers=collaborator_headers,
    )
    assert edit_response.status_code == 200

    # Verify changes and activity
    activity_response = client.get(
        f"/api/universes/{universe_id}/activity", headers=owner_headers
    )
    assert activity_response.status_code == 200
    assert any(
        a["user_id"] == collaborator.id for a in activity_response.json["activities"]
    )


def test_physics_simulation_flow(client, auth_headers):
    """Test physics simulation workflow."""
    # Create scene with physics
    scene = SceneFactory(
        physics_settings={"gravity": {"x": 0, "y": -9.81}, "enabled": True}
    )

    # Add physics objects
    ball = PhysicsObjectFactory(
        scene=scene,
        object_type="circle",
        position={"x": 0, "y": 100},
        velocity={"x": 0, "y": 0},
    )
    ground = PhysicsObjectFactory(
        scene=scene,
        object_type="rectangle",
        position={"x": 0, "y": 0},
        dimensions={"width": 1000, "height": 20},
        is_static=True,
    )

    # Start simulation
    client.post(f"/api/scenes/{scene.id}/physics/start", headers=auth_headers)

    # Get simulation state after some steps
    state_response = client.get(
        f"/api/scenes/{scene.id}/physics/state", headers=auth_headers
    )
    assert state_response.status_code == 200

    # Verify ball has fallen
    ball_state = next(
        obj for obj in state_response.json["objects"] if obj["id"] == ball.id
    )
    assert ball_state["position"]["y"] < 100  # Ball should have fallen
    assert ball_state["velocity"]["y"] < 0  # Should have downward velocity


def test_media_integration(client, auth_headers):
    """Test media effects integration."""
    scene = SceneFactory()

    # Add visual effect
    visual_response = client.post(
        f"/api/scenes/{scene.id}/visual-effects",
        json={
            "name": "Fade",
            "effect_type": "fade",
            "parameters": {"duration": 1.0, "start_opacity": 0, "end_opacity": 1},
        },
        headers=auth_headers,
    )
    assert visual_response.status_code == 201

    # Add audio track
    audio_response = client.post(
        f"/api/scenes/{scene.id}/audio-tracks",
        json={
            "name": "Background",
            "track_type": "background",
            "parameters": {"volume": 0.8, "loop": True},
        },
        headers=auth_headers,
    )
    assert audio_response.status_code == 201

    # Get scene state with media
    scene_response = client.get(f"/api/scenes/{scene.id}", headers=auth_headers)
    assert scene_response.status_code == 200
    assert "visual_effects" in scene_response.json
    assert "audio_tracks" in scene_response.json


def test_websocket_integration(authenticated_websocket_client, scene):
    """Test WebSocket integration with other features."""
    # Join scene
    authenticated_websocket_client.emit("join_scene", {"scene_id": scene.id})
    authenticated_websocket_client.get_received()

    # Create physics object via WebSocket
    authenticated_websocket_client.emit(
        "create_object",
        {
            "scene_id": scene.id,
            "object_data": {"type": "circle", "position": {"x": 0, "y": 0}},
        },
    )

    # Start physics simulation
    authenticated_websocket_client.emit("start_simulation", {"scene_id": scene.id})

    # Verify updates are received
    received = authenticated_websocket_client.get_received()
    assert any(msg["name"] == "physics_state" for msg in received)
    assert any(msg["name"] == "object_created" for msg in received)


def test_error_handling_integration(client, auth_headers):
    """Test error handling across integrated components."""
    # Try to access non-existent resources
    universe_response = client.get("/api/universes/9999", headers=auth_headers)
    assert universe_response.status_code == 404

    # Try invalid physics parameters
    scene = SceneFactory()
    physics_response = client.post(
        f"/api/scenes/{scene.id}/physics-objects",
        json={"object_type": "invalid", "position": {"x": 0, "y": 0}},
        headers=auth_headers,
    )
    assert physics_response.status_code == 400

    # Try invalid collaboration operation
    collab_response = client.post(
        f"/api/universes/{scene.storyboard.universe.id}/collaborators",
        json={"user_id": 9999, "role": "invalid"},
        headers=auth_headers,
    )
    assert collab_response.status_code == 400


def test_performance_integration(client, auth_headers):
    """Test performance with integrated components."""
    universe = UniverseFactory()

    # Create multiple storyboards and scenes
    for i in range(10):
        storyboard = StoryboardFactory(universe=universe)
        for j in range(5):
            scene = SceneFactory(storyboard=storyboard)
            for k in range(10):
                PhysicsObjectFactory(scene=scene)

    # Measure response time for universe data
    import time

    start_time = time.time()
    response = client.get(f"/api/universes/{universe.id}", headers=auth_headers)
    end_time = time.time()

    assert response.status_code == 200
    assert end_time - start_time < 1.0  # Should respond within 1 second


def test_database_integration(client, auth_headers):
    """Test database integration and constraints."""
    universe = UniverseFactory()

    # Test cascading deletes
    storyboard = StoryboardFactory(universe=universe)
    scene = SceneFactory(storyboard=storyboard)

    response = client.delete(f"/api/universes/{universe.id}", headers=auth_headers)
    assert response.status_code == 200

    # Verify all related objects are deleted
    assert Universe.query.get(universe.id) is None
    assert Storyboard.query.get(storyboard.id) is None
    assert Scene.query.get(scene.id) is None
