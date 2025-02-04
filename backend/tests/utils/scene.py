from typing import Dict
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.core.scene import Scene
from app.crud.crud_scene import scene as crud_scene
import uuid

async def create_random_scene(db: AsyncSession, universe_id: int) -> Scene:
    """Create a random scene for testing."""
    scene_in = {
        "name": f"Test Scene {uuid.uuid4()}",
        "description": f"Test scene description {uuid.uuid4()}",
        "universe_id": universe_id,
        "rendering_mode": "3D",
        "physics_enabled": True,
        "music_enabled": True
    }

    return await crud_scene.create(db, obj_in=scene_in)
