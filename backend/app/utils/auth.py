from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity

def require_auth(fn):
    """Decorator to require authentication."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        return fn(*args, **kwargs)
    return wrapper

def check_universe_access(universe, user_id, require_ownership=False):
    """
    Check if a user has access to a universe.

    Args:
        universe: The Universe model instance to check
        user_id: The ID of the user requesting access
        require_ownership: If True, only the creator can access

    Returns:
        bool: True if user has access, False otherwise
    """
    if not universe:
        return False

    # Public universes are accessible to all users unless ownership is required
    if universe.is_public and not require_ownership:
        return True

    # For private universes or when ownership is required, check creator
    return universe.user_id == user_id
