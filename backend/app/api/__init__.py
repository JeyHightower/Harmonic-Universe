"""API package."""

from flask import Blueprint

api_bp = Blueprint('api', __name__)

# Import routes after creating the blueprint to avoid circular imports
from .routes import auth_bp, characters_bp, notes_bp, universes_bp, scenes_bp, physics_bp, music_bp
from .models import User, Character, Note, Universe, Scene

# Register all route blueprints with the main API blueprint
api_bp.register_blueprint(characters_bp)
api_bp.register_blueprint(notes_bp)

__all__ = [
    'api_bp',
    'auth_bp', 'characters_bp', 'notes_bp', 'universes_bp', 'scenes_bp', 'physics_bp', 'music_bp',
    'User', 'Character', 'Note', 'Universe', 'Scene'
]


