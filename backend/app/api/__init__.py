"""API package."""

from flask import Blueprint

api_bp = Blueprint('api', __name__)

# Import routes after creating blueprint to avoid circular imports
from .routes import auth_bp, characters_bp, notes_bp, physics_bp

# Import models
from .models import User, Character, Note, Universe, Scene

# Register blueprints
api_bp.register_blueprint(auth_bp)
api_bp.register_blueprint(characters_bp)
api_bp.register_blueprint(notes_bp)
api_bp.register_blueprint(physics_bp)

__all__ = [
    'api_bp',
    'auth_bp', 'characters_bp', 'notes_bp', 'physics_bp',
    'User', 'Character', 'Note', 'Universe', 'Scene'
]


