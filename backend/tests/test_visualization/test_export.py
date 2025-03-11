import pytest
import asyncio
from pathlib import Path
import json
import numpy as np
from PIL import Image
import ffmpeg

from app.core.visualization.export import ExportManager
from app.models.visualization import RenderingMode, SceneObjectType


@pytest.fixture
def scene_data():
    """Create test scene data."""
    return {
        "id": "scene1",
        "name": "Test Scene",
        "rendering_mode": RenderingMode.WEBGL,
        "camera_settings": {"position": {"x": 0, "y": 0, "z": 5}},
        "lighting_settings": {"ambient": {"intensity": 0.5}},
        "objects": [
            {"id": "obj1", "type": SceneObjectType.MESH, "geometry": {"type": "box"}}
        ],
        "timeline": {"duration": 5.0, "fps": 30},
        "physics_parameters": [
            {"id": "param1", "name": "gravity", "type": "float", "value": 9.81}
        ],
        "music_parameters": [
            {"id": "param2", "name": "tempo", "type": "float", "value": 120}
        ],
    }


@pytest.fixture
def export_data():
    """Create test export data."""
    return {
        "type": "video",
        "format": "mp4",
        "settings": {
            "fps": 30,
            "resolution": {"width": 1280, "height": 720},
            "quality": "high",
        },
    }


@pytest.fixture
def export_manager(scene_data, export_data, tmp_path):
    """Create test export manager."""
    return ExportManager(
        scene_data=scene_data, export_data=export_data, output_dir=tmp_path
    )


@pytest.mark.asyncio
async def test_export_initialization(export_manager, tmp_path):
    """Test export manager initialization."""
    assert not export_manager.is_exporting
    assert export_manager.progress == 0.0
    assert len(export_manager.frame_buffer) == 0

    # Check directory structure
    assert (tmp_path / "frames").exists()
    assert (tmp_path / "data").exists()


@pytest.mark.asyncio
async def test_video_export(export_manager, tmp_path):
    """Test video export functionality."""
    # Start export
    await export_manager.start_export()

    # Check output file
    output_path = tmp_path / "output.mp4"
    assert output_path.exists()

    # Verify video properties using ffprobe
    probe = ffmpeg.probe(str(output_path))
    video_stream = next(s for s in probe["streams"] if s["codec_type"] == "video")

    assert video_stream["width"] == 1280
    assert video_stream["height"] == 720
    assert video_stream["r_frame_rate"] == "30/1"


@pytest.mark.asyncio
async def test_scene_export(export_manager, tmp_path):
    """Test scene data export functionality."""
    # Update export type
    export_manager.export_data["type"] = "scene"

    # Start export
    await export_manager.start_export()

    # Check exported files
    scene_file = tmp_path / "data" / "scene.json"
    objects_file = tmp_path / "data" / "objects.json"
    timeline_file = tmp_path / "data" / "timeline.json"

    assert scene_file.exists()
    assert objects_file.exists()
    assert timeline_file.exists()

    # Verify scene data
    with scene_file.open() as f:
        scene_data = json.load(f)
        assert "camera" in scene_data
        assert "lighting" in scene_data

    # Verify objects data
    with objects_file.open() as f:
        objects_data = json.load(f)
        assert len(objects_data) == 1
        assert objects_data[0]["id"] == "obj1"

    # Verify timeline data
    with timeline_file.open() as f:
        timeline_data = json.load(f)
        assert timeline_data["duration"] == 5.0
        assert timeline_data["fps"] == 30


@pytest.mark.asyncio
async def test_parameter_export(export_manager, tmp_path):
    """Test parameter data export functionality."""
    # Update export type
    export_manager.export_data["type"] = "parameters"

    # Start export
    await export_manager.start_export()

    # Check exported file
    params_file = tmp_path / "data" / "parameters.json"
    assert params_file.exists()

    # Verify parameter data
    with params_file.open() as f:
        params_data = json.load(f)

        assert len(params_data["physics"]) == 1
        assert params_data["physics"][0]["name"] == "gravity"
        assert params_data["physics"][0]["value"] == 9.81

        assert len(params_data["music"]) == 1
        assert params_data["music"][0]["name"] == "tempo"
        assert params_data["music"][0]["value"] == 120


@pytest.mark.asyncio
async def test_frame_rendering(export_manager):
    """Test frame rendering for export."""
    resolution = {"width": 640, "height": 480}
    frame_data = await export_manager.renderer.render_frame()

    # Convert frame to image
    image = export_manager._render_frame_to_image(frame_data, resolution)

    assert isinstance(image, np.ndarray)
    assert image.shape == (480, 640, 3)
    assert image.dtype == np.uint8


@pytest.mark.asyncio
async def test_export_progress(export_manager):
    """Test export progress tracking."""
    progress_values = []

    def progress_callback():
        progress_values.append(export_manager.progress)

    # Start export
    export_manager.export_data["type"] = "video"
    export_manager.export_data["settings"][
        "duration"
    ] = 1.0  # Short duration for testing

    await export_manager.start_export()

    assert len(progress_values) > 0
    assert progress_values[-1] == 100.0


@pytest.mark.asyncio
async def test_export_cancellation(export_manager):
    """Test export cancellation."""
    # Start export in background
    export_task = asyncio.create_task(export_manager.start_export())

    # Wait briefly
    await asyncio.sleep(0.1)

    # Cancel export
    export_manager.cancel_export()
    await export_task

    assert not export_manager.is_exporting
    assert export_manager.progress < 100.0
