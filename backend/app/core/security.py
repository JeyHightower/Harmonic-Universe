"""Security utilities."""

from datetime import datetime, timedelta
from typing import Optional, Union
from flask_jwt_extended import create_access_token as jwt_create_access_token
from flask_jwt_extended import create_refresh_token as jwt_create_refresh_token
from flask_jwt_extended import decode_token

from .pwd_context import verify_password, get_password_hash

def create_access_token(subject: Union[str, int], expires_delta: Optional[timedelta] = None) -> str:
    """Create access token."""
    expires = expires_delta if expires_delta else None
    identity = str(subject)
    additional_claims = {"type": "access"}
    return jwt_create_access_token(
        identity=identity,
        expires_delta=expires,
        additional_claims=additional_claims
    )

def create_refresh_token(subject: Union[str, int], expires_delta: Optional[timedelta] = None) -> str:
    """Create refresh token."""
    expires = expires_delta if expires_delta else None
    identity = str(subject)
    additional_claims = {"type": "refresh"}
    return jwt_create_refresh_token(
        identity=identity,
        expires_delta=expires,
        additional_claims=additional_claims
    )

def verify_access_token(token: str) -> Optional[dict]:
    """Verify access token."""
    try:
        decoded_token = decode_token(token)
        if decoded_token["type"] != "access":
            return None
        return decoded_token
    except Exception:
        return None

__all__ = [
    "verify_password",
    "get_password_hash",
    "create_access_token",
    "create_refresh_token",
    "verify_access_token"
]
