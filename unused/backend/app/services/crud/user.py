"""User CRUD service module."""
from typing import Dict, Optional
from app.models import User
from app.services.crud.base import CRUDBase


class CRUDUser(CRUDBase):
    """CRUD operations for User model."""

    def __init__(self):
        super().__init__(User)

    def create_with_password(self, data: Dict) -> Optional[User]:
        """Create a new user with password."""
        password = data.pop("password", None)
        if not password:
            raise ValueError("Password is required")

        user = self.create(data)
        if user:
            user.set_password(password)
            return user
        return None

    def authenticate(self, email: str, password: str) -> Optional[User]:
        """Authenticate a user."""
        user = self.model.query.filter_by(email=email).first()
        if user and user.check_password(password):
            return user
        return None

    def get_by_email(self, email: str) -> Optional[User]:
        """Get a user by email."""
        return self.model.query.filter_by(email=email).first()

    def get_by_username(self, username: str) -> Optional[User]:
        """Get a user by username."""
        return self.model.query.filter_by(username=username).first()

    def update_password(
        self, user_id: int, old_password: str, new_password: str
    ) -> bool:
        """Update user password."""
        user = self.get(user_id)
        if user and user.check_password(old_password):
            user.set_password(new_password)
            return True
        return False


user_crud = CRUDUser()
