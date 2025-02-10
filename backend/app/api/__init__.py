"""API package."""

from .routes.auth import auth_bp
from .routes.music_generation import audio_bp, visualization_bp, physics_bp, ai_bp
from .routes.universe import universe_bp

__all__ = [
    "auth_bp",
    "universe_bp",
    "audio_bp",
    "visualization_bp",
    "physics_bp",
    "ai_bp"
]
