from typing import Dict

from sqlalchemy.orm import Session
import numpy as np

from app import crud
from app.schemas.user import UserCreate
from app.tests.utils.utils import random_email, random_lower_string

def create_random_user(db: Session) -> Dict:
    """Create a random user for testing."""
    email = random_email()
    full_name = random_lower_string().capitalize() + ' ' + random_lower_string().capitalize()
    password = random_lower_string().capitalize() + random_lower_string() + str(np.random.randint(0, 10))  # Ensure at least one uppercase letter and one number
    username = random_lower_string()
    user_in = UserCreate(email=email, password=password, username=username, full_name=full_name)

    # Ensure full_name is not None or empty
    if not full_name:
        full_name = 'Default Name'

    user = crud.user.create(db=db, obj_in=user_in)
    return user
