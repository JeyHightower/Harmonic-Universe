from typing import Dict, Optional
from app.models import User
from app.services.base import BaseService


class UserService(BaseService):
    """Service class for User model operations."""

    def __init__(self):
        super().__init__(User)

    def create_user(self, data: Dict) -> Optional[User]:
        """Create a new user with password hashing."""
        if self.exists(email=data["email"]):
            raise ValueError("Email already exists")

        if self.exists(username=data["username"]):
            raise ValueError("Username already exists")

        password = data.pop("password", None)
        if not password:
            raise ValueError("Password is required")

        user = self.create(data)
        user.set_password(password)
        return user

    def update_user(self, user_id: int, data: Dict) -> Optional[User]:
        """Update user with password handling."""
        password = data.pop("password", None)
        user = self.update(user_id, data)

        if password and user:
            user.set_password(password)

        return user

    def authenticate(self, email: str, password: str) -> Optional[User]:
        """Authenticate a user."""
        user = self.get_one_by_filter(email=email)
        if user and user.check_password(password):
            return user
        return None

    def change_password(
        self, user_id: int, old_password: str, new_password: str
    ) -> bool:
        """Change user password."""
        user = self.get_by_id(user_id)
        if user and user.check_password(old_password):
            user.set_password(new_password)
            return True
        return False

    def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email."""
        return self.get_one_by_filter(email=email)

    def get_by_username(self, username: str) -> Optional[User]:
        """Get user by username."""
        return self.get_one_by_filter(username=username)
