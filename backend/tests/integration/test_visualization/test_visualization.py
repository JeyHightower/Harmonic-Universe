"""Test visualization functionality."""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from unittest.mock import Mock, AsyncMock, patch
import json
from typing import Dict
from uuid import uuid4

from app.core.visualization.visualization import VisualizationManager
from app.models.core.scene import Scene
from app.models.core.user import User
from app.models.visualization.visualization import Visualization
from app.schemas.visualization import VisualizationCreate, VisualizationUpdate
from app.core.security import get_password_hash

@pytest.fixture
async def test_user(db: AsyncSession) -> Dict:
    """Create test user with a scene."""
    async for session in db:
        # Create test user
        user = User(
            email="test@example.com",
            username="testuser",
            full_name="Test User",
            hashed_password=get_password_hash("testpass123"),
            is_active=True
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)

        # Create test scene
        scene = Scene(
            name="Test Scene",
            description="Test scene description",
            creator_id=user.id
        )
        session.add(scene)
        await session.commit()
        await session.refresh(scene)

        return {
            "id": user.id,
            "email": user.email,
            "active_scene_id": scene.id,
            "obj": user
        }

@pytest.fixture
async def visualization_data(db: AsyncSession, test_user: Dict) -> Dict:
    """Create test visualization data."""
    user_data = await test_user
    async for session in db:
        visualization = Visualization(
            name="Test Visualization",
            description="Test visualization description",
            scene_id=user_data["active_scene_id"],
            settings={
                "camera": {
                    "position": {"x": 0, "y": 5, "z": 10},
                    "target": {"x": 0, "y": 0, "z": 0},
                    "fov": 45,
                    "near": 0.1,
                    "far": 1000
                },
                "lighting": {
                    "ambient": {"intensity": 0.2, "color": "#ffffff"},
                    "directional": [
                        {
                            "intensity": 0.8,
                            "color": "#ffffff",
                            "position": {"x": 1, "y": 1, "z": 1}
                        }
                    ]
                },
                "post_processing": {
                    "enabled": True,
                    "effects": [
                        {
                            "type": "bloom",
                            "strength": 1.0,
                            "radius": 0.7,
                            "threshold": 0.85
                        },
                        {
                            "type": "ambient_occlusion",
                            "radius": 5,
                            "intensity": 1.0
                        }
                    ]
                }
            }
        )
        session.add(visualization)
        await session.commit()
        await session.refresh(visualization)
        return {
            "visualization": visualization,
            "camera": visualization.settings["camera"],
            "lighting": visualization.settings["lighting"],
            "post_processing": visualization.settings["post_processing"]
        }

@pytest.fixture
async def visualization_manager(visualization_data: Dict) -> VisualizationManager:
    """Create test visualization manager."""
    return VisualizationManager(await visualization_data)

@pytest.mark.asyncio
async def test_visualization_initialization(visualization_manager: VisualizationManager, visualization_data: Dict):
    """Test visualization manager initialization."""
    manager = await visualization_manager
    data = await visualization_data
    assert manager.camera_settings == data["camera"]
    assert manager.lighting_settings == data["lighting"]
    assert manager.post_processing_settings == data["post_processing"]

@pytest.mark.asyncio
async def test_camera_control(visualization_manager: VisualizationManager):
    """Test camera control functionality."""
    manager = await visualization_manager

    # Test camera position update
    new_position = {"x": 5, "y": 5, "z": 5}
    result = await manager.update_camera_position(new_position)
    assert result["success"]
    assert manager.camera_settings["position"] == new_position

    # Test camera target update
    new_target = {"x": 1, "y": 0, "z": 0}
    result = await manager.update_camera_target(new_target)
    assert result["success"]
    assert manager.camera_settings["target"] == new_target

    # Test FOV update
    new_fov = 60
    result = await manager.update_camera_fov(new_fov)
    assert result["success"]
    assert manager.camera_settings["fov"] == new_fov

@pytest.mark.asyncio
async def test_lighting_control(visualization_manager: VisualizationManager):
    """Test lighting control functionality."""
    manager = await visualization_manager

    # Test ambient light update
    new_ambient = {"intensity": 0.3, "color": "#cccccc"}
    result = await manager.update_ambient_light(new_ambient)
    assert result["success"]
    assert manager.lighting_settings["ambient"] == new_ambient

    # Test directional light update
    new_directional = {
        "intensity": 0.9,
        "color": "#dddddd",
        "position": {"x": 2, "y": 2, "z": 2}
    }
    result = await manager.update_directional_light(0, new_directional)
    assert result["success"]
    assert manager.lighting_settings["directional"][0] == new_directional

@pytest.mark.asyncio
async def test_post_processing(visualization_manager: VisualizationManager):
    """Test post-processing control."""
    manager = await visualization_manager

    # Test enabling/disabling post-processing
    result = await manager.toggle_post_processing(False)
    assert result["success"]
    assert not manager.post_processing_settings["enabled"]

    result = await manager.toggle_post_processing(True)
    assert result["success"]
    assert manager.post_processing_settings["enabled"]

    # Test updating bloom effect
    new_bloom = {
        "type": "bloom",
        "strength": 1.5,
        "radius": 0.8,
        "threshold": 0.9
    }
    result = await manager.update_post_processing_effect(0, new_bloom)
    assert result["success"]
    assert manager.post_processing_settings["effects"][0] == new_bloom

@pytest.mark.asyncio
async def test_scene_rendering(visualization_manager: VisualizationManager):
    """Test scene rendering functionality."""
    manager = await visualization_manager

    render_config = {
        "width": 1920,
        "height": 1080,
        "samples": 4
    }
    result = await manager.render_scene(render_config)
    assert result["success"]
    assert result["config"] == render_config
    assert "settings" in result
    assert "timestamp" in result

@pytest.mark.asyncio
async def test_visualization_update(visualization_manager: VisualizationManager):
    """Test updating visualization settings."""
    manager = await visualization_manager

    new_settings = {
        "camera": {
            "position": {"x": 10, "y": 10, "z": 10},
            "target": {"x": 0, "y": 0, "z": 0},
            "fov": 50
        },
        "lighting": {
            "ambient": {"intensity": 0.4, "color": "#eeeeee"}
        }
    }

    result = await manager.update_settings(new_settings)
    assert result["success"]
    assert manager.camera_settings["position"] == new_settings["camera"]["position"]
    assert manager.camera_settings["fov"] == new_settings["camera"]["fov"]
    assert manager.lighting_settings["ambient"] == new_settings["lighting"]["ambient"]

@pytest.mark.asyncio
async def test_visualization_export(visualization_manager: VisualizationManager):
    """Test visualization export functionality."""
    manager = await visualization_manager

    export_config = {
        "format": "png",
        "quality": "high",
        "width": 3840,
        "height": 2160
    }

    result = await manager.export(export_config)
    assert result["success"]
    assert result["config"] == export_config
    assert "settings" in result
    assert "timestamp" in result

@pytest.mark.asyncio
async def test_camera_control_validation(visualization_manager: VisualizationManager):
    """Test camera control validation."""
    manager = await visualization_manager

    # Test invalid camera position
    invalid_position = {"x": "invalid", "y": 0, "z": 0}
    result = await manager.update_camera_position(invalid_position)
    assert not result["success"]
    assert "error" in result

    # Test missing coordinates
    incomplete_position = {"x": 1, "y": 2}
    result = await manager.update_camera_position(incomplete_position)
    assert not result["success"]
    assert "error" in result

    # Test invalid FOV values
    invalid_fov = -10
    result = await manager.update_camera_fov(invalid_fov)
    assert not result["success"]
    assert "error" in result

    result = await manager.update_camera_fov(200)
    assert not result["success"]
    assert "error" in result

@pytest.mark.asyncio
async def test_lighting_validation(visualization_manager: VisualizationManager):
    """Test lighting settings validation."""
    manager = await visualization_manager

    # Test invalid ambient light
    invalid_ambient = {"intensity": -1, "color": "invalid"}
    result = await manager.update_ambient_light(invalid_ambient)
    assert not result["success"]
    assert "error" in result

    # Test invalid directional light
    invalid_directional = {
        "intensity": 2.0,
        "color": "#ffffff",
        "position": {"x": "invalid", "y": 0, "z": 0}
    }
    result = await manager.update_directional_light(0, invalid_directional)
    assert not result["success"]
    assert "error" in result

@pytest.mark.asyncio
async def test_post_processing_validation(visualization_manager: VisualizationManager):
    """Test post-processing validation."""
    manager = await visualization_manager

    # Test invalid effect type
    invalid_effect = {
        "type": "invalid_effect",
        "strength": 1.0
    }
    result = await manager.update_post_processing_effect(0, invalid_effect)
    assert not result["success"]
    assert "error" in result

    # Test invalid effect parameters
    invalid_params = {
        "type": "bloom",
        "strength": -1.0,
        "radius": "invalid"
    }
    result = await manager.update_post_processing_effect(0, invalid_params)
    assert not result["success"]
    assert "error" in result

@pytest.mark.asyncio
async def test_concurrent_rendering(visualization_manager: VisualizationManager):
    """Test concurrent rendering requests."""
    manager = await visualization_manager

    # Start first render
    render_config = {
        "width": 1920,
        "height": 1080,
        "samples": 4
    }
    first_render = manager.render_scene(render_config)

    # Attempt second render while first is in progress
    second_render = manager.render_scene(render_config)

    # Both renders should complete, but second should fail
    first_result = await first_render
    second_result = await second_render

    assert first_result["success"]
    assert not second_result["success"]
    assert "already being rendered" in second_result["error"]

@pytest.mark.asyncio
async def test_export_validation(visualization_manager: VisualizationManager):
    """Test export configuration validation."""
    manager = await visualization_manager

    # Test invalid format
    invalid_format = {
        "format": "invalid",
        "quality": "high",
        "width": 1920,
        "height": 1080
    }
    result = await manager.export(invalid_format)
    assert not result["success"]
    assert "error" in result

    # Test invalid dimensions
    invalid_dimensions = {
        "format": "png",
        "quality": "high",
        "width": -1920,
        "height": 0
    }
    result = await manager.export(invalid_dimensions)
    assert not result["success"]
    assert "error" in result

@pytest.mark.asyncio
async def test_complex_settings_update(visualization_manager: VisualizationManager):
    """Test complex settings update with multiple components."""
    manager = await visualization_manager

    complex_settings = {
        "camera": {
            "position": {"x": 5, "y": 5, "z": 5},
            "target": {"x": 0, "y": 0, "z": 0},
            "fov": 60
        },
        "lighting": {
            "ambient": {"intensity": 0.3, "color": "#cccccc"},
            "directional": [
                {
                    "intensity": 0.8,
                    "color": "#ffffff",
                    "position": {"x": 1, "y": 1, "z": 1}
                },
                {
                    "intensity": 0.6,
                    "color": "#ffcccc",
                    "position": {"x": -1, "y": 2, "z": 1}
                }
            ]
        },
        "post_processing": {
            "enabled": True,
            "effects": [
                {
                    "type": "bloom",
                    "strength": 1.2,
                    "radius": 0.8
                },
                {
                    "type": "ambient_occlusion",
                    "radius": 4,
                    "intensity": 0.8
                }
            ]
        }
    }

    result = await manager.update_settings(complex_settings)
    assert result["success"]

    # Verify all settings were updated correctly
    assert manager.camera_settings["position"] == complex_settings["camera"]["position"]
    assert manager.camera_settings["fov"] == complex_settings["camera"]["fov"]
    assert len(manager.lighting_settings["directional"]) == 2
    assert manager.post_processing_settings["effects"][0]["strength"] == 1.2

@pytest.mark.asyncio
async def test_render_progress_tracking(visualization_manager: VisualizationManager):
    """Test render progress tracking."""
    manager = await visualization_manager

    render_config = {
        "width": 1920,
        "height": 1080,
        "samples": 4
    }

    # Start render
    render_task = manager.render_scene(render_config)

    # Check progress while rendering
    assert manager.is_rendering
    assert 0 <= manager.render_progress <= 100

    # Wait for completion
    result = await render_task
    assert result["success"]
    assert not manager.is_rendering
    assert manager.render_progress == 100.0

@pytest.mark.asyncio
async def test_error_recovery(visualization_manager: VisualizationManager):
    """Test error recovery after failed operations."""
    manager = await visualization_manager

    # Cause an error
    result = await manager.update_camera_fov(-1)
    assert not result["success"]
    assert "error" in result

    # Verify manager can still perform valid operations
    valid_result = await manager.update_camera_fov(60)
    assert valid_result["success"]
    assert manager.camera_settings["fov"] == 60
