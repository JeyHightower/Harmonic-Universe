"""Routes package initialization."""

from .auth import auth_bp
from .universe import universe_bp
from .music_generation import audio_bp, visualization_bp, physics_bp, ai_bp
from .physics_objects import physics_objects_bp

__all__ = [
    "auth_bp",
    "universe_bp",
    "audio_bp",
    "visualization_bp",
    "physics_bp",
    "ai_bp",
    "physics_objects_bp"
]
