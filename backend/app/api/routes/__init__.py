from flask import Blueprint, jsonify

# Create API blueprint with version prefix
api_bp = Blueprint('api', __name__, url_prefix='/api')

# Import route modules
from .auth import auth_bp
from .universes import universes_bp
from .user import user_bp
from .modal import modal_bp
from .notes import notes_bp
from .characters import characters_bp
from .scenes import scenes_bp  # Import from scenes/__init__.py instead of scenes.py

# Register blueprints with correct prefixes
api_bp.register_blueprint(auth_bp, url_prefix='/auth')
api_bp.register_blueprint(universes_bp, url_prefix='/universes')
api_bp.register_blueprint(user_bp)
api_bp.register_blueprint(modal_bp)
api_bp.register_blueprint(notes_bp, url_prefix='/notes')
api_bp.register_blueprint(characters_bp, url_prefix='/characters')
api_bp.register_blueprint(scenes_bp, url_prefix='/scenes')

# Add a ping endpoint for health checks
@api_bp.route('/ping', methods=['GET'])
def ping():
    """Simple health check endpoint."""
    return jsonify({"status": "ok", "message": "Service is running"})
