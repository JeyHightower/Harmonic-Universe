"""WebSocket integration test fixtures."""

import pytest
from typing import Dict, Any, AsyncGenerator
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.core.user import User
from app.models.core.scene import Scene
from app.core.security import create_access_token

@pytest.fixture
async def websocket_client(test_user: Dict[str, Any]) -> AsyncGenerator[TestClient, None]:
    """Create a WebSocket test client with authentication."""
    from app.main import app

    access_token = create_access_token(test_user["user"].id)
    client = TestClient(app)
    client.headers = {"Authorization": f"Bearer {access_token}"}

    yield client

@pytest.fixture
def websocket_url(test_scene: Scene) -> str:
    """Get WebSocket URL for testing."""
    return f"/api/v1/ws/scene/{test_scene.id}"

@pytest.fixture
def test_scene_update() -> Dict[str, Any]:
    """Test data for scene updates via WebSocket."""
    return {
        "type": "scene_update",
        "data": {
            "object_id": "test-object",
            "position": {"x": 1, "y": 2, "z": 3},
            "rotation": {"x": 0, "y": 90, "z": 0},
            "scale": {"x": 2, "y": 2, "z": 2}
        }
    }

@pytest.fixture
def test_audio_update() -> Dict[str, Any]:
    """Test data for audio updates via WebSocket."""
    return {
        "type": "audio_update",
        "data": {
            "audio_id": "test-audio",
            "playback_position": 10.5,
            "is_playing": True,
            "volume": 0.8
        }
    }

@pytest.fixture
def test_chat_message() -> Dict[str, Any]:
    """Test data for chat messages via WebSocket."""
    return {
        "type": "chat_message",
        "data": {
            "user_id": "test-user",
            "message": "Hello, world!",
            "timestamp": "2024-02-06T12:00:00Z"
        }
    }
