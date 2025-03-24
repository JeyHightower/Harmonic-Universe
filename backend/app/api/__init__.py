"""API package."""

from flask import Blueprint
from .routes.characters import characters_bp
from .routes.notes import notes_bp

# Create a main API blueprint
api_bp = Blueprint("api", __name__)

# Register all route blueprints with the main API blueprint
api_bp.register_blueprint(characters_bp)
api_bp.register_blueprint(notes_bp)

__all__ = [
    "api_bp",
    "characters_bp",
    "notes_bp"
]


