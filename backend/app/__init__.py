from flask import Flask, jsonify, send_from_directory, Response
from flask_cors import CORS
from flask_migrate import Migrate
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_jwt_extended import JWTManager
from flask_caching import Cache
import os
from pathlib import Path
from typing import Optional, Union
from .config import config

from .api.models.database import db

# Initialize extensions
jwt = JWTManager()
limiter = Limiter(key_func=get_remote_address)
cache = Cache()

def create_app(config_name='default'):
    app = Flask(__name__)
    static_folder = str(Path(__file__).parent.parent / 'frontend' / 'dist')
    app.static_folder = static_folder
    app.static_url_path = ''
    
    # Disable trailing slash redirects
    app.url_map.strict_slashes = False
    
    # Load config
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    limiter.init_app(app)
    cache.init_app(app)
    
    # Configure CORS
    CORS(app, resources={
        r"/api/*": {
            "origins": app.config['CORS_ORIGINS'],
            "methods": app.config['CORS_METHODS'],
            "allow_headers": app.config['CORS_HEADERS'],
            "expose_headers": app.config['CORS_EXPOSE_HEADERS'],
            "max_age": app.config['CORS_MAX_AGE'],
            "supports_credentials": True
        }
    })
    
    # Register API blueprint
    from .api.routes import api_bp
    app.register_blueprint(api_bp)
    
    # Register health check route
    @app.route(app.config['HEALTH_CHECK_ENDPOINT'])
    def health_check():
        return {"status": "healthy"}, 200
    
    # Error handlers
    @app.errorhandler(404)
    def not_found_error(error):
        return {"error": "Not found"}, 404
    
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return {"error": "Internal server error"}, 500
    
    @app.errorhandler(429)
    def ratelimit_handler(e):
        return {"error": "Rate limit exceeded"}, 429
    
    # Create database tables
    with app.app_context():
        try:
            # Import all models to ensure they are registered with SQLAlchemy
            from .api.models import User, Note, Universe, Physics2D, Physics3D, SoundProfile, AudioSample, MusicPiece
            
            # Create tables if they don't exist
            db.create_all()
            print("Database tables created successfully")
        except Exception as e:
            print(f"Error creating database tables: {e}")
            raise e
    
    # JWT error handlers
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({
            'message': 'The token has expired',
            'error': 'token_expired'
        }), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({
            'message': 'Signature verification failed',
            'error': 'invalid_token'
        }), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({
            'message': 'Request does not contain an access token',
            'error': 'authorization_required'
        }), 401

    @jwt.needs_fresh_token_loader
    def token_not_fresh_callback(jwt_header, jwt_payload):
        return jsonify({
            'message': 'The token is not fresh',
            'error': 'fresh_token_required'
        }), 401

    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        return jsonify({
            'message': 'The token has been revoked',
            'error': 'token_revoked'
        }), 401
    
    # Serve favicon.ico
    @app.route('/favicon.ico')
    def favicon() -> Response:
        favicon_path = str(Path(__file__).parent.parent / 'frontend' / 'public')
        return send_from_directory(
            favicon_path,
            'favicon.ico',
            mimetype='image/vnd.microsoft.icon'
        )
    
    # Serve index.html for all non-API routes
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve(path: str = '') -> Response:
        if not app.static_folder:
            app.static_folder = str(Path(__file__).parent.parent / 'frontend' / 'dist')
        if path and os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        return send_from_directory(app.static_folder, 'index.html')
    
    return app
