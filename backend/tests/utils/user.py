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
