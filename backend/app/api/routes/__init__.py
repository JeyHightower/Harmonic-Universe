"""API routes package."""

from flask import Blueprint

# Import blueprints
from .auth import auth_bp
from .users import users_bp
from .universe import universe_bp
from .scenes import scenes_bp
from .physics_objects import physics_objects_bp
from .physics_parameters import physics_parameters_bp
from .music_generation import audio_bp, physics_bp, ai_bp
from .visualization import visualization_bp
from .music_flask import music_bp
from .health import health_bp  # Import from health.py

__all__ = [
    'auth_bp',
    'users_bp',
    'universe_bp',
    'scenes_bp',
    'physics_objects_bp',
    'physics_parameters_bp',
    'audio_bp',
    'visualization_bp',
    'physics_bp',
    'ai_bp',
    'music_bp',
    'health_bp',
]
