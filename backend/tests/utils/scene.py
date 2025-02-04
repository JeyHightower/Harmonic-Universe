<<<<<<< HEAD
"""Scene test utilities."""

from typing import Dict
from sqlalchemy.orm import Session

from app.schemas.scene import SceneCreate
from tests.utils.factories import SceneFactory
from tests.utils.universe import create_random_universe

def create_random_scene(db: Session, *, universe_id: str = None) -> Dict:
    """Create a random scene for testing."""
    if not universe_id:
        universe = create_random_universe(db)
        universe_id = universe["id"]

    scene = SceneFactory(db=db, universe_id=universe_id)
    return {
        "id": scene.id,
        "name": scene.name,
        "description": scene.description,
        "universe_id": scene.universe_id,
        "creator_id": scene.creator_id,
    }
=======
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
>>>>>>> eff55919 (fixed core db functionalithy and async sqlalchemy operations are workink)
