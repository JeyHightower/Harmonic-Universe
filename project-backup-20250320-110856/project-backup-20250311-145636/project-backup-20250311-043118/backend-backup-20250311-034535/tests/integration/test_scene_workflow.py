import pytest
from app.models import Scene, Universe
from ..factories import UniverseFactory, SceneFactory


def test_scene_management_workflow(client, auth_headers, test_user):
    """Test the complete workflow of managing scenes within a universe"""

    # First create a universe
    universe_data = {
        "name": "Scene Test Universe",
        "description": "A universe for testing scene management",
    }
    response = client.post("/api/universes", json=universe_data, headers=auth_headers)
    assert response.status_code == 201
    universe_id = response.json["id"]

    # Create multiple scenes
    scenes_data = [
        {
            "name": f"Test Scene {i}",
            "description": f"Description for scene {i}",
            "universe_id": universe_id,
        }
        for i in range(3)
    ]

    created_scenes = []
    for scene_data in scenes_data:
        response = client.post("/api/scenes", json=scene_data, headers=auth_headers)
        assert response.status_code == 201
        created_scenes.append(response.json)

    # Verify scenes in universe
    response = client.get(f"/api/universes/{universe_id}", headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json["scenes"]) == 3

    # Update a scene
    scene_id = created_scenes[0]["id"]
    update_data = {
        "name": "Updated Scene Name",
        "description": "Updated scene description",
    }
    response = client.put(
        f"/api/scenes/{scene_id}", json=update_data, headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json["name"] == update_data["name"]

    # Reorder scenes
    order_data = {"scene_order": [s["id"] for s in reversed(created_scenes)]}
    response = client.post(
        f"/api/universes/{universe_id}/scene-order",
        json=order_data,
        headers=auth_headers,
    )
    assert response.status_code == 200

    # Verify new order
    response = client.get(f"/api/universes/{universe_id}", headers=auth_headers)
    scenes = response.json["scenes"]
    assert [s["id"] for s in scenes] == order_data["scene_order"]

    # Delete a scene
    response = client.delete(f"/api/scenes/{scene_id}", headers=auth_headers)
    assert response.status_code == 204

    # Verify scene count
    response = client.get(f"/api/universes/{universe_id}", headers=auth_headers)
    assert len(response.json["scenes"]) == 2
