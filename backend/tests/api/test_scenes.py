from typing import Dict
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from fastapi import status

from app import crud
from app.core.config import settings
from app.schemas.scene import SceneCreate, SceneUpdate
from app.models.user import User
from app.models.universe import Universe
from app.models.scene import Scene, RenderingMode

def test_create_scene(
    client: TestClient,
    test_user: User,
    token_headers: Dict[str, str],
    db: Session
) -> None:
    # First create a universe
    universe = crud.universe.create_with_owner(
        db=db,
        obj_in=crud.schemas.UniverseCreate(
            name="Test Universe",
            description="Test description",
            is_public=True,
            settings={"theme": "dark"}
        ),
        owner_id=test_user.id
    )

    data = {
        "name": "Test Scene",
        "description": "A test scene",
        "universe_id": str(universe.id),
        "rendering_mode": "webgl",
        "background_color": "#000000",
        "camera_settings": {
            "position": {"x": 0, "y": 0, "z": 5},
            "rotation": {"x": 0, "y": 0, "z": 0},
            "fov": 75
        },
        "lighting_settings": {
            "ambient": {"intensity": 0.5},
            "directional": {
                "position": {"x": 1, "y": 1, "z": 1},
                "intensity": 0.8
            }
        },
        "post_processing": {},
        "scene_metadata": {"version": "1.0"}
    }

    response = client.post(
        f"{settings.API_V1_STR}/scenes/",
        headers=token_headers,
        json=data
    )
    assert response.status_code == status.HTTP_201_CREATED
    content = response.json()
    assert content["name"] == data["name"]
    assert content["description"] == data["description"]
    assert content["universe_id"] == str(universe.id)
    assert content["rendering_mode"] == data["rendering_mode"]
    assert content["creator_id"] == str(test_user.id)
    assert "id" in content

def test_get_scene(
    client: TestClient,
    test_user: User,
    token_headers: Dict[str, str],
    db: Session
) -> None:
    # Create universe and scene
    universe = crud.universe.create_with_owner(
        db=db,
        obj_in=crud.schemas.UniverseCreate(
            name="Test Universe",
            description="Test description",
            is_public=True,
            settings={"theme": "dark"}
        ),
        owner_id=test_user.id
    )

    scene = crud.scene.create_with_creator(
        db=db,
        obj_in=SceneCreate(
            name="Test Scene",
            description="Test description",
            universe_id=universe.id,
            rendering_mode=RenderingMode.WEBGL,
            background_color="#000000",
            camera_settings={"fov": 75},
            lighting_settings={"ambient": {"intensity": 0.5}},
            post_processing={},
            scene_metadata={"version": "1.0"}
        ),
        creator_id=test_user.id
    )

    response = client.get(
        f"{settings.API_V1_STR}/scenes/{scene.id}",
        headers=token_headers
    )
    assert response.status_code == status.HTTP_200_OK
    content = response.json()
    assert content["name"] == scene.name
    assert content["description"] == scene.description
    assert content["universe_id"] == str(universe.id)
    assert content["creator_id"] == str(test_user.id)

def test_get_scene_not_found(
    client: TestClient,
    token_headers: Dict[str, str]
) -> None:
    response = client.get(
        f"{settings.API_V1_STR}/scenes/00000000-0000-0000-0000-000000000000",
        headers=token_headers
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_update_scene(
    client: TestClient,
    test_user: User,
    token_headers: Dict[str, str],
    db: Session
) -> None:
    # Create universe and scene
    universe = crud.universe.create_with_owner(
        db=db,
        obj_in=crud.schemas.UniverseCreate(
            name="Test Universe",
            description="Test description",
            is_public=True,
            settings={"theme": "dark"}
        ),
        owner_id=test_user.id
    )

    scene = crud.scene.create_with_creator(
        db=db,
        obj_in=SceneCreate(
            name="Test Scene",
            description="Test description",
            universe_id=universe.id,
            rendering_mode=RenderingMode.WEBGL,
            background_color="#000000",
            camera_settings={"fov": 75},
            lighting_settings={"ambient": {"intensity": 0.5}},
            post_processing={},
            scene_metadata={"version": "1.0"}
        ),
        creator_id=test_user.id
    )

    data = {
        "name": "Updated Scene",
        "description": "Updated description",
        "background_color": "#FFFFFF",
        "camera_settings": {"fov": 90},
        "lighting_settings": {"ambient": {"intensity": 0.7}}
    }

    response = client.put(
        f"{settings.API_V1_STR}/scenes/{scene.id}",
        headers=token_headers,
        json=data
    )
    assert response.status_code == status.HTTP_200_OK
    content = response.json()
    assert content["name"] == data["name"]
    assert content["description"] == data["description"]
    assert content["background_color"] == data["background_color"]
    assert content["camera_settings"] == data["camera_settings"]
    assert content["lighting_settings"] == data["lighting_settings"]

def test_delete_scene(
    client: TestClient,
    test_user: User,
    token_headers: Dict[str, str],
    db: Session
) -> None:
    # Create universe and scene
    universe = crud.universe.create_with_owner(
        db=db,
        obj_in=crud.schemas.UniverseCreate(
            name="Test Universe",
            description="Test description",
            is_public=True,
            settings={"theme": "dark"}
        ),
        owner_id=test_user.id
    )

    scene = crud.scene.create_with_creator(
        db=db,
        obj_in=SceneCreate(
            name="Test Scene",
            description="Test description",
            universe_id=universe.id,
            rendering_mode=RenderingMode.WEBGL,
            background_color="#000000",
            camera_settings={"fov": 75},
            lighting_settings={"ambient": {"intensity": 0.5}},
            post_processing={},
            scene_metadata={"version": "1.0"}
        ),
        creator_id=test_user.id
    )

    response = client.delete(
        f"{settings.API_V1_STR}/scenes/{scene.id}",
        headers=token_headers
    )
    assert response.status_code == status.HTTP_204_NO_CONTENT

    # Verify it's deleted
    response = client.get(
        f"{settings.API_V1_STR}/scenes/{scene.id}",
        headers=token_headers
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_get_scene_objects(
    client: TestClient,
    test_user: User,
    token_headers: Dict[str, str],
    db: Session
) -> None:
    # Create universe and scene
    universe = crud.universe.create_with_owner(
        db=db,
        obj_in=crud.schemas.UniverseCreate(
            name="Test Universe",
            description="Test description",
            is_public=True,
            settings={"theme": "dark"}
        ),
        owner_id=test_user.id
    )

    scene = crud.scene.create_with_creator(
        db=db,
        obj_in=SceneCreate(
            name="Test Scene",
            description="Test description",
            universe_id=universe.id,
            rendering_mode=RenderingMode.WEBGL,
            background_color="#000000",
            camera_settings={"fov": 75},
            lighting_settings={"ambient": {"intensity": 0.5}},
            post_processing={},
            scene_metadata={"version": "1.0"}
        ),
        creator_id=test_user.id
    )

    response = client.get(
        f"{settings.API_V1_STR}/scenes/{scene.id}/objects",
        headers=token_headers
    )
    assert response.status_code == status.HTTP_200_OK
    content = response.json()
    assert isinstance(content, list)  # Should return a list, even if empty

def test_unauthorized_access(client: TestClient):
    """Test unauthorized access to scene endpoints."""
    response = client.get(f"{settings.API_V1_STR}/scenes/")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_create_scene_validation(client: TestClient, auth_headers: Dict[str, str], test_universe: Universe):
    """Test scene creation with invalid data."""
    data = {
        "name": "",  # Empty name should fail
        "description": "Test description",
        "universe_id": str(test_universe.id)
    }
    response = client.post(f"{settings.API_V1_STR}/scenes/", json=data, headers=auth_headers)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

def test_update_scene_not_found(client: TestClient, auth_headers: Dict[str, str]):
    """Test updating a non-existent scene."""
    data = {
        "name": "Updated Scene",
        "description": "Updated description"
    }
    response = client.put("/api/scenes/999", json=data, headers=auth_headers)
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_delete_scene_not_found(client: TestClient, auth_headers: Dict[str, str]):
    """Test deleting a non-existent scene."""
    response = client.delete("/api/scenes/999", headers=auth_headers)
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_get_scene_with_assets(client: TestClient, auth_headers: Dict[str, str], test_scene: Scene, test_asset: object):
    """Test getting a scene with its associated assets."""
    response = client.get(
        f"{settings.API_V1_STR}/scenes/{test_scene.id}/assets",
        headers=auth_headers
    )
    assert response.status_code == status.HTTP_200_OK
    content = response.json()
    assert isinstance(content, list)
    assert len(content) >= 1
    assert any(asset["id"] == test_asset.id for asset in content)

def test_scene_position_validation(client: TestClient, auth_headers: Dict[str, str], test_universe: Universe):
    """Test scene creation with invalid position data."""
    data = {
        "name": "Test Scene",
        "description": "Test description",
        "universe_id": str(test_universe.id),
        "position": {"x": "invalid", "y": 0, "z": 0}  # Invalid position
    }
    response = client.post(f"{settings.API_V1_STR}/scenes/", json=data, headers=auth_headers)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
