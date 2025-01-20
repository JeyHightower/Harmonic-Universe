from .auth_routes import auth_bp
from .universe_routes import universe_bp
from .user_routes import user_bp
from .comment_routes import comment_bp
from .favorite_routes import favorite_bp
from .audio_routes import audio_bp
from .storyboard_routes import storyboard_bp
from .visualization_routes import visualization_bp

__all__ = [
    'auth_bp',
    'universe_bp',
    'user_bp',
    'comment_bp',
    'favorite_bp',
    'audio_bp',
    'storyboard_bp',
    'visualization_bp'
]
