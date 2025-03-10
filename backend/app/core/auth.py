"""Authentication utilities."""

from typing import Optional
from flask import current_app, g
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from functools import wraps

from backend.app.models.user import User
from backend.app.db.session import get_db
from .errors import AuthenticationError, AuthorizationError

def get_current_user() -> Optional[User]:
    """Get current authenticated user."""
    if hasattr(g, 'current_user'):
        return g.current_user

    try:
        verify_jwt_in_request()
        user_id = get_jwt_identity()

        with get_db() as db:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                g.current_user = user
                return user
    except Exception:
        return None

    return None

def get_current_active_user() -> User:
    """Get current active user or raise error."""
    current_user = get_current_user()
    if not current_user:
        raise AuthenticationError("Not authenticated")
    if not current_user.is_active:
        raise AuthorizationError("User is inactive")
    return current_user

def require_auth(f):
    """Decorator to require authentication."""
    @wraps(f)
    def decorated(*args, **kwargs):
        current_user = get_current_active_user()
        return f(*args, **kwargs)
    return decorated

def require_role(role_name: str):
    """Decorator to require specific role."""
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            current_user = get_current_active_user()
            if not any(role.name == role_name for role in current_user.roles):
                raise AuthorizationError(f"Role {role_name} required")
            return f(*args, **kwargs)
        return decorated
    return decorator

def require_permission(permission: str):
    """Decorator to require specific permission."""
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            current_user = get_current_active_user()
            if not current_user.has_permission(permission):
                raise AuthorizationError(f"Permission {permission} required")
            return f(*args, **kwargs)
        return decorated
    return decorator

__all__ = [
    'get_current_user',
    'get_current_active_user',
    'require_auth',
    'require_role',
    'require_permission'
]
