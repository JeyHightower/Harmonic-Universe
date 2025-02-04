<<<<<<< HEAD
"""User test utilities."""

from typing import Dict
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.schemas.user import UserCreate
from tests.utils.factories import UserFactory

def create_random_user(db: Session) -> Dict:
    """Create a random user for testing."""
    user = UserFactory(db=db)
    return {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "password": "testpass123",  # Original password before hashing
        "is_active": user.is_active,
        "is_superuser": user.is_superuser,
        "full_name": user.full_name,
    }
=======
from typing import Dict
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.security import get_password_hash
from app.models.core.user import User
from app.crud.crud_user import user as crud_user
import uuid

async def create_random_user(db: AsyncSession) -> Dict:
    """Create a random user for testing."""
    user_in = {
        "email": f"test{uuid.uuid4()}@example.com",
        "password": "testpassword",
        "full_name": f"Test User {uuid.uuid4()}"
    }

    user = await crud_user.create(db, obj_in=user_in)
    return {"user": user, "password": user_in["password"]}
>>>>>>> eff55919 (fixed core db functionalithy and async sqlalchemy operations are workink)
