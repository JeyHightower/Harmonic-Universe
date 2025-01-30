"""Authentication service module."""
from typing import Optional, Dict, Any
from flask_jwt_extended import create_access_token
from sqlalchemy import select
from app.models import User
from app.extensions import db


class AuthService:
    """Service class for handling authentication operations."""

    @staticmethod
    def authenticate_user(email: str, password: str) -> Optional[Dict[str, Any]]:
        """Authenticate a user and return access token."""
        stmt = select(User).filter_by(email=email)
        user = db.session.execute(stmt).scalar_one_or_none()

        if user and user.check_password(password):
            access_token = create_access_token(identity=str(user.id))
            return {"token": access_token, "user": user.to_dict()}
        return None

    @staticmethod
    def register_user(username: str, email: str, password: str) -> Optional[Dict[str, Any]]:
        """Register a new user."""
        # Check for existing email
        stmt = select(User).filter_by(email=email)
        if db.session.execute(stmt).scalar_one_or_none():
            return None

        user = User(username=username, email=email)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()

        access_token = create_access_token(identity=str(user.id))
        return {"token": access_token, "user": user.to_dict()}
