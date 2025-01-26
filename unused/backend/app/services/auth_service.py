"""Authentication service for handling user authentication and authorization."""
from typing import Optional, Tuple
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
from datetime import timedelta
from app.models import User
from app.extensions import db
from .base import BaseService


class AuthService(BaseService):
    """Service class for handling authentication operations."""

    def __init__(self):
        """Initialize the auth service."""
        super().__init__(User)

    def register_user(
        self, username: str, email: str, password: str
    ) -> Tuple[User, str]:
        """Register a new user.

        Args:
            username (str): The username for the new user
            email (str): The email address for the new user
            password (str): The password for the new user

        Returns:
            Tuple[User, str]: A tuple containing the created user and access token
        """
        # Create new user
        user = User(username=username, email=email)
        user.set_password(password)

        # Add and commit to database
        db.session.add(user)
        db.session.commit()

        # Create access token
        access_token = create_access_token(
            identity=user.id, expires_delta=timedelta(days=1)
        )

        return user, access_token

    def authenticate_user(
        self, email: str, password: str
    ) -> Tuple[Optional[User], Optional[str]]:
        """Authenticate a user with email and password.

        Args:
            email (str): The user's email
            password (str): The user's password

        Returns:
            Tuple[Optional[User], Optional[str]]: A tuple containing the user and access token if authentication succeeds
        """
        user = User.query.filter_by(email=email).first()

        if user and user.check_password(password):
            access_token = create_access_token(
                identity=user.id, expires_delta=timedelta(days=1)
            )
            return user, access_token

        return None, None

    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """Get a user by their ID.

        Args:
            user_id (int): The ID of the user to retrieve

        Returns:
            Optional[User]: The user if found, None otherwise
        """
        return User.query.get(user_id)

    def update_password(
        self, user: User, current_password: str, new_password: str
    ) -> bool:
        """Update a user's password.

        Args:
            user (User): The user whose password to update
            current_password (str): The user's current password
            new_password (str): The new password to set

        Returns:
            bool: True if password was updated successfully, False otherwise
        """
        if user.check_password(current_password):
            user.set_password(new_password)
            db.session.commit()
            return True
        return False

    @staticmethod
    def register(username, email, password):
        """Register a new user."""
        user = User(
            username=username,
            email=email,
            password_hash=generate_password_hash(password),
        )
        db.session.add(user)
        db.session.commit()
        token = create_access_token(identity=user.id)
        return user, token

    @staticmethod
    def login(email, password):
        """Login a user."""
        user = User.query.filter_by(email=email).first()
        if user and check_password_hash(user.password_hash, password):
            token = create_access_token(identity=user.id)
            return user, token
        return None, None
