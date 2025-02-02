from typing import Dict

from sqlalchemy.orm import Session

from app import crud
from app.schemas.universe import UniverseCreate
from app.tests.utils.utils import random_lower_string
from app.tests.utils.user import create_random_user

def create_random_universe(db: Session) -> Dict:
    """Create a random universe for testing."""
    name = random_lower_string()
    description = random_lower_string()
    user = create_random_user(db)
    universe_in = UniverseCreate(
        name=name,
        description=description,
        owner_id=user.id
    )
    universe = crud.universe.create(db=db, obj_in=universe_in)
    return universe
