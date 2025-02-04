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
