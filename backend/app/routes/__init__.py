"""Routes module initialization."""
from .auth_routes import auth_bp
from .universe_routes import universe_bp
from .user_routes import user_bp

__all__ = ['auth_bp', 'universe_bp', 'user_bp']

# Import models to ensure they are registered with SQLAlchemy
from ..models import *  # noqa
