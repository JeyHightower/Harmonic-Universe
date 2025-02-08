"""Security utilities."""

from datetime import datetime, timedelta
from typing import Optional, Union
from jose import jwt

from app.core.config import settings
from app.core.pwd_context import verify_password, get_password_hash

def create_access_token(subject: Union[str, int], expires_delta: Optional[timedelta] = None) -> str:
    """Create access token."""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "type": "access"
    }
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt

def create_refresh_token(subject: Union[str, int], expires_delta: Optional[timedelta] = None) -> str:
    """Create refresh token."""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "type": "refresh"
    }
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt

__all__ = [
    "verify_password",
    "get_password_hash",
    "create_access_token",
    "create_refresh_token"
]
