import os
import sys
import logging

from pathlib import Path
from typing import Optional, Union, cast, Any, Dict, List, Tuple
from logging.handlers import RotatingFileHandler
from datetime import timedelta

# Fix the import path to ensure PyJWT is used instead of the local JWT module
jwt_module_path = next((p for p in sys.path if 'site-packages' in p), None)
if jwt_module_path:
    sys.path.insert(0, jwt_module_path)

from flask import Flask, jsonify, request, make_response, send_from_directory, Response, current_app, redirect, url_for
from flask_cors import CORS
from flask_migrate import Migrate
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_jwt_extended import JWTManager
import hmac
import hashlib
from werkzeug.middleware.proxy_fix import ProxyFix
from functools import partial
from dotenv import load_dotenv

# Restore original path order
if jwt_module_path and sys.path[0] == jwt_module_path:
    sys.path.pop(0)

from .extensions import db, migrate, jwt, limiter
from .api.routes import api_bp
from app.config import config_by_name
from app.extensions import init_extensions
from app.utils.jwt import apply_all_jwt_patches, configure_jwt

# Initialize caching
try:
    from flask_caching import Cache
    has_flask_caching = True
except ImportError:
    print("WARNING: flask_caching not found, caching will be disabled")
    has_flask_caching = False

# Import fixes modules
try:
    from fixes.mime_override import apply_all_mime_fixes
    from fixes.render import apply_render_fixes
    FIXES_AVAILABLE = True
except ImportError:
    print("WARNING: fixes modules not found, continuing without fixes")
    FIXES_AVAILABLE = False

# Initialize extensions
from .extensions import db, migrate, jwt, limiter

class DummyCache:
    def __init__(self, *args, **kwargs):
        pass

    def init_app(self, app):
        pass

    def cached(self, *args, **kwargs):
        def decorator(f):
            return f
        return decorator

    def memoize(self, *args, **kwargs):
        def decorator(f):
            return f
        return decorator

cache = Cache() if has_flask_caching else DummyCache()

def setup_static_folder(app):
    """Configure static folder and handle fallbacks if the primary location doesn't exist."""
    if os.path.exists(app.static_folder):
        try:
            static_files = os.listdir(app.static_folder)
            print(f"Static folder contains {len(static_files)} files")
            if 'index.html' in static_files:
                print(f"index.html exists (size: {os.path.getsize(os.path.join(app.static_folder, 'index.html'))} bytes)")
            else:
                print("WARNING: index.html not found in static folder")
        except Exception as e:
            print(f"Error inspecting static folder: {str(e)}")
    else:
        print(f"WARNING: Static folder does not exist at {app.static_folder}")
        possible_static_folders = [
            os.environ.get('STATIC_FOLDER'),
            os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', 'static')),
            os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static')),
            '/opt/render/project/src/static',
            '/opt/render/project/src/backend/static'
        ]

        for folder in possible_static_folders:
            if folder and os.path.exists(folder) and os.path.isdir(folder):
                app.static_folder = folder
                print(f"Using alternative static folder: {app.static_folder}")
                break

def setup_cors(app):
    """Configure CORS for the application"""
    origins = [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
    ]

    # Configure CORS with specific settings
    CORS(app, resources={
        r"/*": {
            "origins": origins,
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
            "allow_headers": [
                "Content-Type",
                "Authorization",
                "X-Requested-With",
                "Accept",
                "Origin",
                "X-Demo-User",
                "X-Request-Attempt"
            ],
            "supports_credentials": True,
            "expose_headers": ["Content-Type", "Authorization"],
            "max_age": 86400,  # 24 hours
        }
    })

    # Add global response handler for CORS headers
    @app.after_request
    def after_request(response):
        # Only add CORS headers if they haven't been set by Flask-CORS
        if 'Access-Control-Allow-Origin' not in response.headers:
            # Get the origin from the request headers or use a safe default
            origin = request.headers.get('Origin', 'http://localhost:5173')

            # Set CORS headers
            response.headers.add('Access-Control-Allow-Origin', origin)
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept,Origin,X-Demo-User,X-Request-Attempt')
            response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH')
            response.headers.add('Access-Control-Allow-Credentials', 'true')
            response.headers.add('Access-Control-Max-Age', '86400')

        return response

    return app

def setup_error_handlers(app):
    """Configure error handlers for the application."""
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

def setup_jwt_handlers(app):
    """Configure JWT token handlers."""
    # Ensure JWT secret key is correctly set
    secret_key = app.config.get('JWT_SECRET_KEY')
    if not secret_key:
        secret_key = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-key')
        app.config['JWT_SECRET_KEY'] = secret_key

    # Log the JWT secret key for debugging in development
    if app.config.get('ENV') == 'development' or os.environ.get('FLASK_DEBUG', 'False').lower() == 'true':
        app.logger.debug(f"JWT secret key in use (first 3 chars): {secret_key[:3]}...")

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({
            'message': 'The token has expired',
            'error': 'token_expired'
        }), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        if app.config.get('ENV') == 'production':
            app.logger.warning(f"Invalid token error: {error}")
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

def setup_routes(app):
    """Configure application routes."""
    # Health check endpoint
    @app.route(app.config['HEALTH_CHECK_ENDPOINT'])
    def health_check():
        return {"status": "healthy"}, 200

    # Favicon route
    @app.route('/favicon.ico')
    def favicon() -> Response:
        return send_from_directory(
            cast(str, app.static_folder),
            'favicon.ico',
            mimetype='image/vnd.microsoft.icon'
        )

    # Debug static files endpoint
    @app.route('/api/debug/static')
    def debug_static():
        files = []
        static_dir = cast(str, app.static_folder)
        if os.path.exists(static_dir):
            for root, dirs, filenames in os.walk(static_dir):
                for filename in filenames:
                    file_path = os.path.join(root, filename)
                    rel_path = os.path.relpath(file_path, static_dir)
                    files.append({
                        'path': rel_path,
                        'size': os.path.getsize(file_path)
                    })

        return jsonify({
            'static_folder': static_dir,
            'static_url_path': app.static_url_path,
            'files': files,
            'static_folder_exists': os.path.exists(static_dir)
        })

    # SPA route handler
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    @limiter.limit("500 per hour")  # Increased from 100 to 500
    def react_root(path: str = '') -> Union[Response, tuple[Response, int]]:
        if path.startswith('api/'):
            return jsonify({"error": "Not found"}), 404

        if path == 'favicon.ico':
            return send_from_directory(cast(str, app.static_folder), 'favicon.ico')

        return app.send_static_file('index.html')

def configure_logging(app):
    """Configure logging for the application."""
    if not app.debug and not app.testing:
        if not os.path.exists('logs'):
            os.mkdir('logs')
        file_handler = RotatingFileHandler('logs/harmonic_universe.log', maxBytes=10240, backupCount=10)
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
        ))
        file_handler.setLevel(logging.INFO)
        app.logger.addHandler(file_handler)

        app.logger.setLevel(logging.INFO)
        app.logger.info('Harmonic Universe startup')

def setup_static_folders(app):
    """Configure static folders for the application."""
    # Look for static folders in various locations
    possible_static_folders = [
        os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', 'static')),
        os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static')),
        os.environ.get('STATIC_FOLDER'),
        '/opt/render/project/src/static',
        '/opt/render/project/src/backend/static'
    ]

    for folder in possible_static_folders:
        if folder and os.path.exists(folder) and os.path.isdir(folder):
            app.static_folder = folder
            app.logger.info(f"Using static folder: {app.static_folder}")
            break

    return app

def register_error_handlers(app):
    """Register error handlers for the application."""
    setup_error_handlers(app)
    return app

def create_app(config_name=None):
    """
    Create and configure the Flask application based on the specified configuration.

    Args:
        config_name: The configuration environment to use (development, testing, production)

    Returns:
        The configured Flask application
    """

    app = Flask(__name__, static_folder=None)

    # Determine which config to use if not specified
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development').lower()

    # Map environment names to config classes
    config_mapping = {
        'dev': 'DevelopmentConfig',
        'development': 'DevelopmentConfig',
        'test': 'TestingConfig',
        'testing': 'TestingConfig',
        'prod': 'ProductionConfig',
        'production': 'ProductionConfig',
        'default': 'DevelopmentConfig'
    }

    # Get the config class name
    config_class = config_mapping.get(config_name, 'DevelopmentConfig')

    # Load the appropriate configuration
    app.config.from_object(f"app.config.{config_class}")

    # Log the configuration being used
    app.logger.info(f"Using configuration: {config_class}")

    # Configure logging
    configure_logging(app)

    # Configure JWT settings
    configure_jwt(app)

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)
    limiter.init_app(app)

    # Set up JWT handlers
    setup_jwt_handlers(app)

    # Import and apply JWT monkey patch
    try:
        apply_all_jwt_patches()
        app.logger.info("JWT monkey patches applied successfully")
    except Exception as e:
        app.logger.warning(f"Failed to apply JWT monkey patches: {str(e)}")

    # Set up CORS (before blueprints)
    setup_cors(app)

    # Set up static folders
    setup_static_folders(app)

    # Register API routes
    app.register_blueprint(api_bp, url_prefix='/api')

    # Register error handlers
    register_error_handlers(app)

    # Register main routes
    setup_routes(app)

    return app
