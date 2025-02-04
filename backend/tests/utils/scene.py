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
