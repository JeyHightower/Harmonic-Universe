from flask import Blueprint, jsonify, Flask

# Import routes
from app.api.routes.auth import auth_bp
from app.api.routes.user import user_bp
from app.api.routes.universes import universes_bp
from app.api.routes.scenes import scenes_bp
from app.api.routes.characters import characters_bp
from app.api.routes.notes import notes_bp
# from app.api.routes.health import health_bp  # Commented out as it doesn't exist

# Create and configure the api blueprint
api_bp = Blueprint('api', __name__)

def register_routes(app):
    # Register all blueprints with the api blueprint
    api_bp.register_blueprint(auth_bp, url_prefix='/auth')
    api_bp.register_blueprint(user_bp, url_prefix='/user')
    api_bp.register_blueprint(universes_bp, url_prefix='/universes')
    api_bp.register_blueprint(scenes_bp, url_prefix='/scenes')
    api_bp.register_blueprint(characters_bp, url_prefix='/characters')
    api_bp.register_blueprint(notes_bp, url_prefix='/notes')
    # api_bp.register_blueprint(health_bp, url_prefix='/health')  # Commented out as it doesn't exist

    # Add a catch-all route for invalid parameters
    @api_bp.route('/api-error/invalid-parameters', methods=['GET'])
    @api_bp.route('/api-error/invalid-parameters/<path:subpath>', methods=['GET'])
    def handle_invalid_parameters(subpath=None):
        """Handle requests with invalid parameters gracefully"""
        return jsonify({
            'message': 'Invalid request parameters',
            'error': 'The request contains undefined or invalid parameters',
            'data': [],
            'item': {}
        }), 200

    # Register the api blueprint with the app
    app.register_blueprint(api_bp, url_prefix='/api') 