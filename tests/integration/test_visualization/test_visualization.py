"""Test visualization functionality."""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from unittest.mock import Mock, AsyncMock, patch
import json
from typing import Dict

from app.core.visualization.visualization import VisualizationManager
from app.models.core.scene import Scene
from app.models.visualization.visualization import Visualization
from app.schemas.visualization import VisualizationCreate, VisualizationUpdate

@pytest.fixture
async def visualization_data(db: AsyncSession, test_user: Dict) -> Dict:
    """Create test visualization data."""
    visualization = Visualization(
        name="Test Visualization",
        description="Test visualization description",
        scene_id=test_user["active_scene_id"],
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
    db.add(visualization)
    await db.commit()
    await db.refresh(visualization)
    return {
        "visualization": visualization,
        "camera": visualization.settings["camera"],
        "lighting": visualization.settings["lighting"],
        "post_processing": visualization.settings["post_processing"]
    }

@pytest.fixture
async def visualization_manager(visualization_data: Dict) -> VisualizationManager:
    """Create test visualization manager."""
    return VisualizationManager(visualization_data)

@pytest.mark.asyncio
async def test_visualization_initialization(visualization_manager: VisualizationManager, visualization_data: Dict):
    """Test visualization manager initialization."""
    assert visualization_manager.camera_settings == visualization_data["camera"]
    assert visualization_manager.lighting_settings == visualization_data["lighting"]
    assert visualization_manager.post_processing_settings == visualization_data["post_processing"]

@pytest.mark.asyncio
async def test_camera_control(visualization_manager: VisualizationManager):
    """Test camera control functionality."""
    # Test camera position update
    new_position = {"x": 5, "y": 5, "z": 5}
    result = await visualization_manager.update_camera_position(new_position)
    assert result["success"]
    assert visualization_manager.camera_settings["position"] == new_position

    # Test camera target update
    new_target = {"x": 1, "y": 0, "z": 0}
    result = await visualization_manager.update_camera_target(new_target)
    assert result["success"]
    assert visualization_manager.camera_settings["target"] == new_target

    # Test FOV update
    new_fov = 60
    result = await visualization_manager.update_camera_fov(new_fov)
    assert result["success"]
    assert visualization_manager.camera_settings["fov"] == new_fov

@pytest.mark.asyncio
async def test_lighting_control(visualization_manager: VisualizationManager):
    """Test lighting control functionality."""
    # Test ambient light update
    new_ambient = {"intensity": 0.3, "color": "#cccccc"}
    result = await visualization_manager.update_ambient_light(new_ambient)
    assert result["success"]
    assert visualization_manager.lighting_settings["ambient"] == new_ambient

    # Test directional light update
    new_directional = {
        "intensity": 0.9,
        "color": "#dddddd",
        "position": {"x": 2, "y": 2, "z": 2}
    }
    result = await visualization_manager.update_directional_light(0, new_directional)
    assert result["success"]
    assert visualization_manager.lighting_settings["directional"][0] == new_directional

@pytest.mark.asyncio
async def test_post_processing(visualization_manager: VisualizationManager):
    """Test post-processing control."""
    # Test enabling/disabling post-processing
    result = await visualization_manager.toggle_post_processing(False)
    assert result["success"]
    assert not visualization_manager.post_processing_settings["enabled"]

    result = await visualization_manager.toggle_post_processing(True)
    assert result["success"]
    assert visualization_manager.post_processing_settings["enabled"]

    # Test updating bloom effect
    new_bloom = {
        "type": "bloom",
        "strength": 1.5,
        "radius": 0.8,
        "threshold": 0.9
    }
    result = await visualization_manager.update_post_processing_effect(0, new_bloom)
    assert result["success"]
    assert visualization_manager.post_processing_settings["effects"][0] == new_bloom

@pytest.mark.asyncio
async def test_scene_rendering(visualization_manager: VisualizationManager):
    """Test scene rendering functionality."""
    render_config = {
        "width": 1920,
        "height": 1080,
        "samples": 4
    }
    result = await visualization_manager.render_scene(render_config)
    assert result["success"]
    assert result["config"] == render_config
    assert "settings" in result
    assert "timestamp" in result

@pytest.mark.asyncio
async def test_visualization_update(visualization_manager: VisualizationManager):
    """Test updating visualization settings."""
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

    result = await visualization_manager.update_settings(new_settings)
    assert result["success"]
    assert visualization_manager.camera_settings["position"] == new_settings["camera"]["position"]
    assert visualization_manager.camera_settings["fov"] == new_settings["camera"]["fov"]
    assert visualization_manager.lighting_settings["ambient"] == new_settings["lighting"]["ambient"]

@pytest.mark.asyncio
async def test_visualization_export(visualization_manager: VisualizationManager):
    """Test visualization export functionality."""
    export_config = {
        "format": "png",
        "quality": "high",
        "width": 3840,
        "height": 2160
    }

    result = await visualization_manager.export(export_config)
    assert result["success"]
    assert result["config"] == export_config
    assert "settings" in result
    assert "timestamp" in result
