"""Routes package initialization."""

from .auth import auth_bp
from .universe import universe_bp
from .music_generation import audio_bp, visualization_bp, physics_bp, ai_bp
from .physics_objects import physics_objects_bp
from .scenes import scenes_bp
from .users import users_bp
from .physics_parameters import physics_parameters_bp
from .music_flask import music_bp

__all__ = [
    "auth_bp",
    "universe_bp",
    "audio_bp",
    "visualization_bp",
    "physics_bp",
    "ai_bp",
    "physics_objects_bp",
    "scenes_bp",
    "users_bp",
    "physics_parameters_bp",
    "music_bp"
]
