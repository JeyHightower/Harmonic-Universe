"""
API route configuration.
"""

from flask import Blueprint

# Create blueprints
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')
users_bp = Blueprint('users', __name__, url_prefix='/api/users')
audio_bp = Blueprint('audio', __name__, url_prefix='/api/audio')
universe_bp = Blueprint('universe', __name__, url_prefix='/api/universes')
visualization_bp = Blueprint('visualization', __name__, url_prefix='/api/visualizations')
physics_bp = Blueprint('physics', __name__, url_prefix='/api/physics')
ai_bp = Blueprint('ai', __name__, url_prefix='/api/ai')

# Import routes to register them with blueprints
from backend.app.api.endpoints import (
    auth,
    users,
    audio,
    universes,
    visualizations,
    physics,
    ai
)

# Register routes with blueprints
auth.init_routes(auth_bp)
users.init_routes(users_bp)
audio.init_routes(audio_bp)
universes.init_routes(universe_bp)
visualizations.init_routes(visualization_bp)
physics.init_routes(physics_bp)
ai.init_routes(ai_bp)

__all__ = [
    'auth_bp',
    'users_bp',
    'audio_bp',
    'universe_bp',
    'visualization_bp',
    'physics_bp',
    'ai_bp'
]
