"""
Scene test utilities.
"""

from typing import Dict
from uuid import UUID
from sqlalchemy.orm import Session

from app import crud
from app.schemas.scene import SceneCreate
from app.tests.utils.utils import random_lower_string
from app.models.scene import RenderingMode

def create_random_scene(db: Session, universe_id: UUID) -> Dict:
    """Create a random scene for testing."""
    name = random_lower_string()
    description = random_lower_string()
    scene_in = SceneCreate(
        name=name,
        description=description,
        universe_id=universe_id,
        rendering_mode=RenderingMode.SOLID
    )
    scene = crud.scene.create(db=db, obj_in=scene_in)
    return scene
