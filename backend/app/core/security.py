"""Security utilities."""

from datetime import datetime, timedelta
from typing import Any, Union
from functools import wraps

from jose import jwt
from passlib.context import CryptContext
from flask_jwt_extended import get_jwt_identity
from flask import current_app
from app.core.config import settings
from app.models.user import User
from app.core.errors import AuthenticationError

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(
    subject: Union[str, Any],
    expires_delta: timedelta = None
) -> str:
    """Create JWT access token."""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Generate password hash."""
    return pwd_context.hash(password)

def get_current_user():
    """Get the current authenticated user."""
    user_id = get_jwt_identity()
    if not user_id:
        raise AuthenticationError("Could not authenticate user")

    user = User.query.get(user_id)
    if not user:
        raise AuthenticationError("User not found")

    return user
