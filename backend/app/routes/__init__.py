from .auth_routes import auth_bp
from .music_routes import music_bp
from .physics_routes import physics_bp
from .storyboard_routes import storyboard_bp
from .universe_routes import universe_bp
from .user_routes import user_bp

__all__ = [
    'auth_bp',
    'music_bp',
    'physics_bp',
    'storyboard_bp',
    'universe_bp',
    'user_bp'
]
