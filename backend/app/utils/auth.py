"""Authentication utility functions."""
from functools import wraps
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from flask import current_app


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
        user_id: The ID of the user requesting access (can be string or int)
        require_ownership: If True, only the creator can access

    Returns:
        bool: True if user has access, False otherwise
    """
    try:
        if not universe:
            return False

        # Convert user_id to int if it's a string
        try:
            user_id = int(user_id)
        except (ValueError, TypeError):
            current_app.logger.error(f"Invalid user_id format: {user_id}")
            return False

        # Public universes are accessible to all users unless ownership is required
        if universe.is_public and not require_ownership:
            return True

        # For private universes or when ownership is required, check creator
        return universe.user_id == user_id
    except Exception as e:
        current_app.logger.error(f"Error in check_universe_access: {str(e)}")
        return False


def require_universe_access(role='viewer'):
    """Decorator to require universe access with specified role."""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            user_id = get_jwt_identity()  # Keep as string

            universe_id = kwargs.get('universe_id')
            if universe_id:
                from app.models.universe import Universe
                universe = Universe.query.get(universe_id)
                if not check_universe_access(universe, user_id, role == 'owner'):
                    return {'error': 'Access denied'}, 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator
