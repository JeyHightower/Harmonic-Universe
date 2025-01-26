"""Routes module initialization."""
from .auth_routes import auth_bp
from .universe_routes import universe_bp
from .user_routes import user_bp
from .analytics_routes import analytics_bp
from .storyboard_routes import storyboard_bp
from .collaborator_routes import collaborator_bp
from .comment_routes import comment_bp
from .favorite_routes import favorite_bp
from .export import export_bp
from .notifications import notifications_bp
from .preferences import preferences_bp

__all__ = [
    "auth_bp",
    "universe_bp",
    "user_bp",
    "analytics_bp",
    "storyboard_bp",
    "collaborator_bp",
    "comment_bp",
    "favorite_bp",
    "export_bp",
    "notifications_bp",
    "preferences_bp"
]

# Import models to ensure they are registered with SQLAlchemy
from ..models import *  # noqa
