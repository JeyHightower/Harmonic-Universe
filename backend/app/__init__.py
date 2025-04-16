from flask import Flask, jsonify, send_from_directory, Response, render_template, current_app, request, make_response
from flask_cors import CORS
from flask_migrate import Migrate
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_jwt_extended import JWTManager
import os
import logging
import click
from pathlib import Path
from typing import Optional, Union, cast, Any
from logging.handlers import RotatingFileHandler
from .config import Config
import hmac
import hashlib
from datetime import datetime, timedelta
from werkzeug.middleware.proxy_fix import ProxyFix
from functools import partial

from .extensions import db, migrate, jwt, limiter
from .api.routes import api_bp
from app.api.routes.auth.jwt_monkey_patch import apply_all_jwt_patches  # Use the existing JWT patch utility
# from app.routes import register_routes  # This module doesn't exist
from app.api import register_routes  # Use register_routes from app.api
from app.config import config_by_name
from app.extensions import init_extensions

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
limiter = Limiter(
    key_func=get_remote_address,
    storage_uri="memory://",
    storage_options={}
)

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

def setup_cors_handlers(app):
    """Set up CORS handlers for OPTIONS preflight requests.
    
    This function adds a route handler specifically for OPTIONS requests to the API,
    which responds with appropriate CORS headers based on the app's configuration.
    """
    
    # This function is kept for backward compatibility but we'll rely on Flask-CORS
    # for all CORS handling to avoid duplications
    pass

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

def create_app(config_name="development"):
    """
    Create and configure the Flask application based on the specified configuration.
    
    Args:
        config_name: The configuration environment to use (development, testing, production)
        
    Returns:
        The configured Flask application
    """
    
    app = Flask(__name__, static_folder=None)
    
    # Load the appropriate configuration
    app.config.from_object(f"app.config.{config_name.capitalize()}Config")
    
    # Configure logging
    configure_logging(app)
    
    # Configure JWT token settings
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)
    app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=30)
    
    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)
    limiter.init_app(app)
    
    # Import and apply JWT monkey patch
    try:
        apply_all_jwt_patches()
        app.logger.info("JWT monkey patches applied successfully")
    except Exception as e:
        app.logger.warning(f"Failed to apply JWT monkey patches: {str(e)}")
    
    # Set up CORS
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

def setup_cors(app):
    """Configure CORS for the application."""
    # Extract CORS configuration from app config
    origins = app.config.get('CORS_CONFIG', {}).get('ORIGINS', ['*'])
    
    # Set explicit CORS_ORIGINS for use in other parts of the application
    app.config['CORS_ORIGINS'] = origins
    
    # Configure CORS
    CORS(app, 
         resources={r"/api/*": {"origins": origins}},
         supports_credentials=app.config.get('CORS_SUPPORTS_CREDENTIALS', True),
         methods=app.config.get('CORS_METHODS'),
         allow_headers=app.config.get('CORS_HEADERS'),
         expose_headers=app.config.get('CORS_EXPOSE_HEADERS'),
         max_age=app.config.get('CORS_MAX_AGE'))
    
    return app

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
