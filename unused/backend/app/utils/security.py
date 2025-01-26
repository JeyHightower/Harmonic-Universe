from functools import wraps
from flask import request, abort, current_app
import redis
from datetime import datetime, timedelta
import secrets
from typing import Optional
import jwt
from werkzeug.security import generate_password_hash as _generate_hash
from werkzeug.security import check_password_hash as _check_hash

# Initialize Redis for rate limiting
redis_client = redis.Redis(host="localhost", port=6379, db=0, decode_responses=True)


def generate_csrf_token():
    """Generate a new CSRF token"""
    return secrets.token_hex(32)


def validate_csrf_token(token):
    """Validate the CSRF token"""
    if not token:
        return False
    stored_token = current_app.config.get("CSRF_TOKEN")
    return secrets.compare_digest(stored_token, token) if stored_token else False


def csrf_protect(f):
    """CSRF protection decorator"""

    @wraps(f)
    def decorated_function(*args, **kwargs):
        if request.method in ["POST", "PUT", "DELETE", "PATCH"]:
            token = request.headers.get("X-CSRF-Token")
            if not validate_csrf_token(token):
                abort(403, description="Invalid CSRF token")
        return f(*args, **kwargs)

    return decorated_function


def rate_limit(requests_per_minute=60):
    """Rate limiting decorator"""

    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Get client IP
            client_ip = request.remote_addr
            # Create a unique key for this route and IP
            key = f"rate_limit:{client_ip}:{request.endpoint}"

            # Get current count
            count = redis_client.get(key)
            if count is None:
                # First request, set expiry to 1 minute
                redis_client.setex(key, 60, 1)
            else:
                count = int(count)
                if count >= requests_per_minute:
                    abort(429, description="Too many requests")
                redis_client.incr(key)

            return f(*args, **kwargs)

        return decorated_function

    return decorator


def sanitize_input(data):
    """Sanitize input data"""
    if isinstance(data, str):
        # Remove potentially dangerous characters
        return data.replace("<", "&lt;").replace(">", "&gt;")
    elif isinstance(data, dict):
        return {k: sanitize_input(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [sanitize_input(x) for x in data]
    return data


def validate_file_size(file, max_size_mb=5):
    """Validate file size"""
    if file.content_length > max_size_mb * 1024 * 1024:
        abort(413, description=f"File size exceeds {max_size_mb}MB limit")
    return True


def hash_password(password):
    """
    Hash a password using Werkzeug's secure hash.

    Args:
        password (str): Plain text password

    Returns:
        str: Hashed password
    """
    return _generate_hash(password)


def verify_password(password, hashed_password):
    """
    Verify a password against its hash.

    Args:
        password (str): Plain text password to verify
        hashed_password (str): Hashed password to check against

    Returns:
        bool: True if password matches hash, False otherwise
    """
    return _check_hash(hashed_password, password)


def generate_token(user_id: int, expiration: Optional[timedelta] = None) -> str:
    """Generate a JWT token for a user."""
    if expiration is None:
        expiration = timedelta(days=1)

    payload = {
        "user_id": user_id,
        "exp": datetime.utcnow() + expiration,
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, current_app.config["SECRET_KEY"], algorithm="HS256")


def verify_token(token: str) -> Optional[int]:
    """Verify a JWT token and return the user ID if valid."""
    try:
        payload = jwt.decode(
            token, current_app.config["SECRET_KEY"], algorithms=["HS256"]
        )
        return payload["user_id"]
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def generate_reset_token(user_id: int) -> str:
    """Generate a password reset token."""
    payload = {
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(hours=1),
        "type": "reset",
    }
    return jwt.encode(payload, current_app.config["SECRET_KEY"], algorithm="HS256")


def verify_reset_token(token: str) -> Optional[int]:
    """Verify a password reset token."""
    try:
        payload = jwt.decode(
            token, current_app.config["SECRET_KEY"], algorithms=["HS256"]
        )
        if payload.get("type") != "reset":
            return None
        return payload["user_id"]
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
