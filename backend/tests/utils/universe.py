<<<<<<< HEAD
"""Universe test utilities."""

from typing import Dict
from sqlalchemy.orm import Session

from app.schemas.universe import UniverseCreate
from tests.utils.factories import UniverseFactory
from tests.utils.user import create_random_user

def create_random_universe(db: Session, *, creator_id: str = None) -> Dict:
    """Create a random universe for testing."""
    if not creator_id:
        creator = create_random_user(db)
        creator_id = creator["id"]

    universe = UniverseFactory(db=db, creator_id=creator_id)
    return {
        "id": universe.id,
        "name": universe.name,
        "description": universe.description,
        "creator_id": universe.creator_id,
        "physics_parameters": universe.physics_parameters,
        "music_parameters": universe.music_parameters,
    }
=======
from typing import Dict
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.core.universe import Universe
from app.crud.crud_universe import universe as crud_universe
import uuid

async def create_random_universe(db: AsyncSession) -> Universe:
    """Create a random universe for testing."""
    universe_in = {
        "name": f"Test Universe {uuid.uuid4()}",
        "description": f"Test universe description {uuid.uuid4()}"
    }

    return crud_universe.create(db, obj_in=universe_in)
>>>>>>> eff55919 (fixed core db functionalithy and async sqlalchemy operations are workink)
