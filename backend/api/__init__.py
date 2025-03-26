"""API package."""

from flask import Blueprint
from .database import db, migrate

api_bp = Blueprint('api', __name__)

# Import models first to avoid circular imports
from .models import (
    User, Character, Note, Universe, Scene,
    Physics2D, Physics3D, PhysicsObject, PhysicsConstraint
)

# Import routes after models
from .routes import auth_bp, characters_bp, notes_bp, physics_bp

# Register blueprints
api_bp.register_blueprint(auth_bp)
api_bp.register_blueprint(characters_bp)
api_bp.register_blueprint(notes_bp)
api_bp.register_blueprint(physics_bp)

__all__ = [
    'api_bp',
    'db', 'migrate',
    'auth_bp', 'characters_bp', 'notes_bp', 'physics_bp',
    'User', 'Character', 'Note', 'Universe', 'Scene',
    'Physics2D', 'Physics3D', 'PhysicsObject', 'PhysicsConstraint'
]


