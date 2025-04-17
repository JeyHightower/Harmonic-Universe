"""
Core JWT functionality for token creation, verification, and decoding.
"""

from datetime import datetime, timedelta, timezone
import jwt
import logging
from flask import current_app, request
from .config import get_jwt_secret_key

# Setup logger
logger = logging.getLogger(__name__)

def create_token(payload, secret_key, expires_delta=None):
    """
    Create a JWT token with the provided payload and expiration time.
    
    Args:
        payload (dict): The payload to encode in the token
        secret_key (str): The secret key used to sign the token
        expires_delta (timedelta, optional): The expiration time delta. Defaults to 1 hour.
    
    Returns:
        str: The encoded JWT token
    """
    if expires_delta is None:
        expires_delta = timedelta(hours=1)
    
    now = datetime.now(timezone.utc)
    payload_copy = payload.copy()
    payload_copy.update({
        'exp': now + expires_delta,
        'iat': now,
    })
    
    try:
        encoded_token = jwt.encode(payload_copy, secret_key, algorithm='HS256')
        return encoded_token
    except Exception as e:
        logger.error(f"Error creating token: {str(e)}")
        raise

def decode_token_without_verification(token):
    """
    Decode a JWT token without verifying the signature.
    Useful for debugging or extracting claims from expired tokens.
    
    Args:
        token (str): The JWT token to decode
    
    Returns:
        dict: The decoded token payload
    """
    try:
        # Decode without verification
        decoded = jwt.decode(token, options={"verify_signature": False}, algorithms=['HS256'])
        return decoded
    except Exception as e:
        logger.error(f"Error decoding token without verification: {str(e)}")
        raise

def verify_token_signature(token, secret_key):
    """
    Verify that a token was signed with the given secret key.
    
    Args:
        token (str): The JWT token to verify
        secret_key (str): The secret key that should have been used to sign the token
    
    Returns:
        bool: True if the token signature is valid, False otherwise
    """
    try:
        # First decode without verification to get payload
        payload = decode_token_without_verification(token)
        
        # Now try to decode with verification
        jwt.decode(token, secret_key, algorithms=['HS256'])
        return True
    except jwt.InvalidSignatureError:
        logger.warning("Token has invalid signature")
        return False
    except Exception as e:
        logger.error(f"Error verifying token signature: {str(e)}")
        return False

def decode_token(token, secret_key, verify_exp=True):
    """
    Decode a JWT token and verify its signature.
    
    Args:
        token (str): The JWT token to decode
        secret_key (str): The secret key used to sign the token
        verify_exp (bool): Whether to verify if the token is expired
    
    Returns:
        dict: The decoded token payload
    """
    try:
        options = {"verify_exp": verify_exp}
        decoded = jwt.decode(token, secret_key, algorithms=['HS256'], options=options)
        return decoded
    except jwt.ExpiredSignatureError:
        logger.warning("Token has expired")
        raise
    except jwt.InvalidTokenError as e:
        logger.error(f"Invalid token: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Error decoding token: {str(e)}")
        raise

def is_token_expired(token):
    """
    Check if a token is expired without raising an exception.
    
    Args:
        token (str): The JWT token to check
    
    Returns:
        bool: True if the token is expired, False otherwise
    """
    try:
        payload = decode_token_without_verification(token)
        
        # Check if 'exp' claim is present
        if 'exp' not in payload:
            logger.warning("Token does not have an expiration claim")
            return False
        
        # Check if token is expired
        exp_timestamp = payload['exp']
        now_timestamp = datetime.now(timezone.utc).timestamp()
        
        return exp_timestamp < now_timestamp
    except Exception as e:
        logger.error(f"Error checking token expiration: {str(e)}")
        return True  # Consider it expired if we can't check

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