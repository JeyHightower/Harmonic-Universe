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
