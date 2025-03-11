"""API package."""

from flask import Blueprint
from .routes.auth import auth_bp
from .routes.music_generation import audio_bp, physics_bp, ai_bp
from .routes.visualization import visualization_bp
from .routes.universe import universe_bp
from .routes.physics_objects import physics_objects_bp

# Create a main API blueprint
api_bp = Blueprint("api", __name__)

# Register all route blueprints with the main API blueprint
api_bp.register_blueprint(auth_bp)
api_bp.register_blueprint(audio_bp)
api_bp.register_blueprint(visualization_bp)
api_bp.register_blueprint(universe_bp)
api_bp.register_blueprint(physics_bp)
api_bp.register_blueprint(ai_bp)
api_bp.register_blueprint(physics_objects_bp)

__all__ = [
    "api_bp",
    "auth_bp",
    "universe_bp",
    "audio_bp",
    "visualization_bp",
    "physics_bp",
    "ai_bp",
    "physics_objects_bp",
]
