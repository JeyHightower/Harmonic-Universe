from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request, decode_token
from .models import User


def require_auth(f):
    """Decorator to require authentication for a route."""

    @wraps(f)
    def decorated(*args, **kwargs):
        try:
            verify_jwt_in_request()
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({"error": "Authentication required"}), 401

    return decorated


def get_current_user():
    """Get the current authenticated user."""
    try:
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user:
            return None
        return user
    except Exception:
        return None


def require_admin(f):
    """Decorator to require admin privileges for a route."""

    @wraps(f)
    def decorated(*args, **kwargs):
        user = get_current_user()
        if not user or not user.is_admin:
            return jsonify({"error": "Admin privileges required"}), 403
        return f(*args, **kwargs)

    return decorated


def verify_token(token):
    """Verify a JWT token and return the user ID."""
    try:
        decoded = decode_token(token)
        return decoded['sub']  # sub contains the user ID
    except Exception:
        return None
