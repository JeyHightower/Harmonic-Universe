"""Universe model test fixtures."""

import pytest
from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.core.universe import Universe
from app.models.core.user import User
import uuid

@pytest.fixture
async def test_universe_data(test_user: User) -> Dict[str, Any]:
    """Get test universe data."""
    return {
        "name": f"Test Universe {uuid.uuid4()}",
        "description": f"A test universe created at {uuid.uuid4()}",
        "creator_id": test_user.id,
        "is_public": True,
        "metadata": {
            "genre": "science fiction",
            "theme": "space exploration",
            "tags": ["test", "demo", "universe"]
        }
    }

@pytest.fixture
async def test_universe(db: AsyncSession, test_universe_data: Dict[str, Any]) -> Universe:
    """Create a test universe."""
    universe = Universe(
        name=test_universe_data["name"],
        description=test_universe_data["description"],
        creator_id=test_universe_data["creator_id"],
        is_public=test_universe_data["is_public"],
        metadata=test_universe_data["metadata"]
    )
    db.add(universe)
    await db.commit()
    await db.refresh(universe)
    return universe

@pytest.fixture
async def test_private_universe(db: AsyncSession, test_user: User) -> Universe:
    """Create a test private universe."""
    universe_data = {
        "name": f"Private Universe {uuid.uuid4()}",
        "description": f"A private test universe created at {uuid.uuid4()}",
        "creator_id": test_user.id,
        "is_public": False,
        "metadata": {
            "genre": "fantasy",
            "theme": "medieval",
            "tags": ["private", "test", "universe"]
        }
    }
    universe = Universe(**universe_data)
    db.add(universe)
    await db.commit()
    await db.refresh(universe)
    return universe
