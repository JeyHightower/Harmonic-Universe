"""
Core JWT functionality for token creation, verification, and decoding.
"""

from datetime import datetime, timedelta
import jwt
from flask import current_app, request
from .config import get_jwt_secret_key

def create_token(user_id: int, expires_delta: timedelta = None) -> str:
    """
    Create a JWT token for a user.
    
    Args:
        user_id: The ID of the user
        expires_delta: Optional expiration time delta
        
    Returns:
        str: The encoded JWT token
    """
    if expires_delta is None:
        expires_delta = timedelta(hours=1)
        
    now = datetime.utcnow()
    payload = {
        'sub': str(user_id),  # Always store as string for consistency
        'iat': int(now.timestamp()),
        'exp': int((now + expires_delta).timestamp()),
        'type': 'access'
    }
    
    secret_key = get_jwt_secret_key(None)
    return jwt.encode(payload, secret_key, algorithm='HS256')

def verify_token(token: str) -> tuple[bool, dict]:
    """
    Verify a JWT token.
    
    Args:
        token: The JWT token to verify
        
    Returns:
        tuple: (is_valid, payload_or_error)
    """
    try:
        secret_key = get_jwt_secret_key(None)
        payload = jwt.decode(token, secret_key, algorithms=['HS256'])
        return True, payload
    except Exception as e:
        return False, {'error': str(e)}

def decode_token(token: str, verify: bool = True) -> dict:
    """
    Decode a JWT token with optional verification.
    
    Args:
        token: The JWT token to decode
        verify: Whether to verify the signature
        
    Returns:
        dict: The decoded token payload
    """
    options = {"verify_signature": verify}
    secret_key = get_jwt_secret_key(None) if verify else None
    return jwt.decode(token, secret_key, algorithms=['HS256'], options=options)

def get_token_from_header() -> str | None:
    """
    Extract JWT token from the Authorization header.
    
    Returns:
        str | None: The token if found, None otherwise
    """
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        return auth_header.split(' ')[1]
    return None 