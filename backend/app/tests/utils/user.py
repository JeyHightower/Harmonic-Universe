from typing import Dict

from sqlalchemy.orm import Session

from app import crud
from app.schemas.user import UserCreate
from app.tests.utils.utils import random_email, random_lower_string

def create_random_user(db: Session) -> Dict:
    """Create a random user for testing."""
    email = random_email()
    password = random_lower_string()
    username = random_lower_string()
    user_in = UserCreate(email=email, password=password, username=username)
    user = crud.user.create(db=db, obj_in=user_in)
    return user
