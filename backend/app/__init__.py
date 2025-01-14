# app/__init__.py
from flask import Flask, jsonify, request
from flask_cors import CORS
from app.config import Config
from app.extensions import db, migrate, cors, csrf, session
from app.routes.auth_routes import auth_bp
from app.routes.universe_routes import universe_bp
from app.routes.physics_routes import physics_bp
from app.routes.music_routes import music_bp
from app.routes.storyboard_routes import storyboard_bp
import logging

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Configure logging
    logging.basicConfig(level=logging.DEBUG)
    logger = logging.getLogger(__name__)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)

    # Configure CORS to allow credentials and specific origins
    cors.init_app(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
            "supports_credentials": True,
            "allow_headers": ["Content-Type", "Authorization"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
        }
    })

    # Disable CSRF for API routes
    csrf.exempt(auth_bp)
    csrf.exempt(universe_bp)
    csrf.exempt(physics_bp)
    csrf.exempt(music_bp)
    csrf.exempt(storyboard_bp)

    # Request preprocessing
    @app.before_request
    def log_request_info():
        logger.debug('Headers: %s', dict(request.headers))
        logger.debug('Body: %s', request.get_data())

    @app.before_request
    def handle_preflight():
        if request.method == "OPTIONS":
            response = app.make_default_options_response()
            return response

    @app.before_request
    def handle_json():
        if request.method in ['POST', 'PUT']:
            if not request.is_json:
                logger.error('Request is not JSON')
                return jsonify({
                    'error': 'Content-Type must be application/json',
                    'message': 'Invalid content type'
                }), 400
            try:
                data = request.get_json()
                if data is None:
                    logger.error('No JSON data in request')
                    return jsonify({
                        'error': 'No data provided',
                        'message': 'Request body is required'
                    }), 400
            except Exception as e:
                logger.error('JSON parsing error: %s', str(e))
                return jsonify({
                    'error': 'Invalid JSON',
                    'message': str(e)
                }), 400

    # Register error handlers
    @app.errorhandler(400)
    def bad_request_error(error):
        logger.error('400 error: %s', str(error))
        return jsonify({
            'error': 'Bad Request',
            'message': str(error.description) if hasattr(error, 'description') else 'Invalid request data'
        }), 400

    @app.errorhandler(401)
    def unauthorized_error(error):
        logger.error('401 error: %s', str(error))
        return jsonify({
            'error': 'Unauthorized',
            'message': str(error.description) if hasattr(error, 'description') else 'Authentication required'
        }), 401

    @app.errorhandler(404)
    def not_found_error(error):
        logger.error('404 error: %s', str(error))
        return jsonify({
            'error': 'Not Found',
            'message': str(error.description) if hasattr(error, 'description') else 'Resource not found'
        }), 404

    @app.errorhandler(500)
    def internal_error(error):
        logger.error('500 error: %s', str(error))
        return jsonify({
            'error': 'Internal Server Error',
            'message': str(error.description) if hasattr(error, 'description') else 'An unexpected error occurred'
        }), 500

    # Register blueprints with URL prefix
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(universe_bp, url_prefix='/api/universes')
    app.register_blueprint(physics_bp, url_prefix='/api/universes/<int:universe_id>/physics')
    app.register_blueprint(music_bp, url_prefix='/api/universes/<int:universe_id>/music')
    app.register_blueprint(storyboard_bp, url_prefix='/api/universes/<int:universe_id>/storyboard')

    return app
