"""Authentication utilities."""
from typing import Optional
from functools import wraps
from flask_jwt_extended import get_jwt_identity
from app.models.core.user import User
from app.db.session import get_db
from app.core.errors import AuthenticationError

def get_current_user() -> Optional[User]:
    """Get the current authenticated user."""
    user_id = get_jwt_identity()
    if not user_id:
        return None

    with get_db() as db:
        return User.get_by_id(db, user_id)

def require_auth(func):
    """Decorator to require authentication."""
    @wraps(func)
    def wrapper(*args, **kwargs):
        user = get_current_user()
        if not user:
            raise AuthenticationError("Authentication required")
        return func(*args, **kwargs)
    return wrapper
