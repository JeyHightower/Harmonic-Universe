"""User model test fixtures."""

import pytest
from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.core.user import User
from app.core.security import get_password_hash
import uuid

@pytest.fixture
async def test_user_data() -> Dict[str, Any]:
    """Get test user data."""
    return {
        "email": f"test{uuid.uuid4()}@example.com",
        "password": "testpassword123",
        "full_name": f"Test User {uuid.uuid4()}",
        "is_active": True,
        "is_superuser": False
    }

@pytest.fixture
async def test_user(db: AsyncSession, test_user_data: Dict[str, Any]) -> User:
    """Create a test user."""
    user = User(
        email=test_user_data["email"],
        hashed_password=get_password_hash(test_user_data["password"]),
        full_name=test_user_data["full_name"],
        is_active=test_user_data["is_active"],
        is_superuser=test_user_data["is_superuser"]
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

@pytest.fixture
async def test_superuser(db: AsyncSession) -> User:
    """Create a test superuser."""
    user_data = {
        "email": f"admin{uuid.uuid4()}@example.com",
        "password": "admin123",
        "full_name": f"Admin User {uuid.uuid4()}",
        "is_active": True,
        "is_superuser": True
    }
    user = User(
        email=user_data["email"],
        hashed_password=get_password_hash(user_data["password"]),
        full_name=user_data["full_name"],
        is_active=user_data["is_active"],
        is_superuser=user_data["is_superuser"]
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user
