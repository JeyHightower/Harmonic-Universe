"""
User test utilities.
"""

from typing import Dict
from sqlalchemy.orm import Session
from fastapi.testclient import TestClient

from app import crud
from app.core.config import settings
from app.schemas.user import UserCreate
from app.tests.utils.utils import random_email, random_lower_string

def create_random_user(db: Session) -> Dict[str, str]:
    """Create a random user for testing."""
    email = random_email()
    password = random_lower_string()
    user_in = UserCreate(
        email=email,
        password=password,
        username=random_lower_string(),
        full_name=random_lower_string()
    )
    user = crud.user.create(db=db, obj_in=user_in)
    return {"email": email, "password": password, "user": user}

def user_authentication_headers(
    *,
    client: TestClient,
    email: str,
    password: str,
) -> Dict[str, str]:
    """Get user authentication headers."""
    data = {"username": email, "password": password}

    r = client.post(f"{settings.API_V1_STR}/login/access-token", data=data)
    response = r.json()
    auth_token = response["access_token"]
    headers = {"Authorization": f"Bearer {auth_token}"}
    return headers
