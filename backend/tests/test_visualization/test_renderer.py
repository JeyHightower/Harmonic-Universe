import pytest
import asyncio
from flask_socketio import SocketIO
from unittest.mock import Mock, AsyncMock
import json

from app.core.visualization.renderer import Renderer
from app.models.visualization import RenderingMode, SceneObjectType

@pytest.fixture
def scene_data():
    """Create test scene data."""
    return {
        "rendering_mode": RenderingMode.WEBGL,
        "camera_settings": {
            "position": {"x": 0, "y": 0, "z": 5},
            "rotation": {"x": 0, "y": 0, "z": 0},
            "fov": 75
        },
        "lighting_settings": {
            "ambient": {"color": "#ffffff", "intensity": 0.5},
            "directional": [
                {
                    "color": "#ffffff",
                    "intensity": 1.0,
                    "position": {"x": 1, "y": 1, "z": 1}
                }
            ]
        },
        "objects": [
            {
                "id": "obj1",
                "type": SceneObjectType.MESH,
                "visible": True,
                "position": {"x": 0, "y": 0, "z": 0},
                "rotation": {"x": 0, "y": 0, "z": 0},
                "scale": {"x": 1, "y": 1, "z": 1},
                "geometry": {
                    "type": "box",
                    "width": 1,
                    "height": 1,
                    "depth": 1
                },
                "material": {
                    "color": "#ff0000",
                    "metalness": 0.5,
                    "roughness": 0.5
                }
            }
        ],
        "post_processing": [
            {
                "type": "bloom",
                "intensity": 1.0,
                "threshold": 0.8
            }
        ],
        "fps": 60
    }

@pytest.fixture
def renderer(scene_data):
    """Create test renderer."""
    return Renderer(scene_data)

@pytest.mark.asyncio
async def test_renderer_initialization(renderer, scene_data):
    """Test renderer initialization."""
    assert renderer.mode == RenderingMode.WEBGL
    assert renderer.frame_count == 0
    assert not renderer.is_running
    assert len(renderer.clients) == 0
    assert renderer.scene_data == scene_data

@pytest.mark.asyncio
async def test_render_frame(renderer):
    """Test rendering a single frame."""
    frame_data = await renderer.render_frame()

    assert "frame_number" in frame_data
    assert "timestamp" in frame_data
    assert "objects" in frame_data
    assert "camera" in frame_data
    assert "lights" in frame_data

    assert len(frame_data["objects"]) == 1
    obj = frame_data["objects"][0]
    assert obj["id"] == "obj1"
    assert obj["type"] == SceneObjectType.MESH
    assert "transform" in obj
    assert "geometry" in obj
    assert "material" in obj

@pytest.mark.asyncio
async def test_process_object(renderer):
    """Test processing different object types."""
    # Test mesh object
    mesh_obj = {
        "id": "mesh1",
        "type": SceneObjectType.MESH,
        "visible": True,
        "position": {"x": 0, "y": 0, "z": 0},
        "geometry": {"type": "box"},
        "material": {"color": "#ff0000"}
    }
    processed = renderer._process_object(mesh_obj)
    assert processed["type"] == SceneObjectType.MESH
    assert "geometry" in processed
    assert "material" in processed

    # Test light object
    light_obj = {
        "id": "light1",
        "type": SceneObjectType.LIGHT,
        "visible": True,
        "position": {"x": 0, "y": 0, "z": 0},
        "parameters": {
            "color": "#ffffff",
            "intensity": 1.0,
            "shadow": True
        }
    }
    processed = renderer._process_object(light_obj)
    assert processed["type"] == SceneObjectType.LIGHT
    assert "color" in processed
    assert "intensity" in processed
    assert "shadow" in processed

    # Test invisible object
    invisible_obj = {
        "id": "inv1",
        "type": SceneObjectType.MESH,
        "visible": False
    }
    processed = renderer._process_object(invisible_obj)
    assert processed is None

@pytest.mark.asyncio
async def test_process_parameter_visual(renderer):
    """Test processing parameter visualization objects."""
    # Test waveform visualization
    waveform_obj = {
        "id": "wave1",
        "type": SceneObjectType.PARAMETER_VISUAL,
        "parameters": {
            "visual_type": "waveform",
            "audio_data": [0.1, -0.2, 0.3],
            "range": {"min": -1, "max": 1},
            "resolution": 100
        }
    }
    processed = renderer._process_object(waveform_obj)
    assert processed["type"] == SceneObjectType.PARAMETER_VISUAL
    assert processed["visual_type"] == "waveform"
    assert "data" in processed
    assert "points" in processed["data"]

    # Test spectrum visualization
    spectrum_obj = {
        "id": "spec1",
        "type": SceneObjectType.PARAMETER_VISUAL,
        "parameters": {
            "visual_type": "spectrum",
            "fft_data": [1, 2, 3],
            "range": {"min": 0, "max": 20000},
            "scale": "linear"
        }
    }
    processed = renderer._process_object(spectrum_obj)
    assert processed["type"] == SceneObjectType.PARAMETER_VISUAL
    assert processed["visual_type"] == "spectrum"
    assert "data" in processed
    assert "frequencies" in processed["data"]

@pytest.mark.asyncio
async def test_post_processing(renderer):
    """Test applying post-processing effects."""
    frame_data = {
        "frame_number": 0,
        "objects": []
    }

    processed = renderer._apply_post_processing(frame_data)
    assert "post_processing" in processed
    assert "bloom" in processed["post_processing"]
    assert processed["post_processing"]["bloom"]["intensity"] == 1.0
    assert processed["post_processing"]["bloom"]["threshold"] == 0.8

@pytest.mark.asyncio
async def test_client_management(renderer):
    """Test SocketIO client management."""
    # Create mock SocketIO client
    mock_client = Mock(spec=SocketIO)

    # Add client
    await renderer.add_client(mock_client)
    assert len(renderer.clients) == 1
    assert renderer.clients[0] == mock_client

    # Remove client
    await renderer.remove_client(mock_client)
    assert len(renderer.clients) == 0

@pytest.mark.asyncio
async def test_broadcast_frame(renderer):
    """Test broadcasting frame data to clients."""
    # Create mock SocketIO clients
    mock_client1 = Mock(spec=SocketIO)
    mock_client2 = Mock(spec=SocketIO)

    # Add clients
    await renderer.add_client(mock_client1)
    await renderer.add_client(mock_client2)

    # Create test frame data
    frame_data = {
        "frame_number": 0,
        "objects": []
    }

    # Broadcast frame
    await renderer.broadcast_frame(frame_data)

    # Verify both clients received the frame
    mock_client1.emit.assert_called_once_with('frame', frame_data)
    mock_client2.emit.assert_called_once_with('frame', frame_data)

    # Test handling disconnected client
    mock_client1.emit.side_effect = Exception("Connection lost")
    await renderer.broadcast_frame(frame_data)
    assert len(renderer.clients) == 1
    assert renderer.clients[0] == mock_client2
