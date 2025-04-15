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

from .extensions import db, migrate, jwt
from .api.routes import api_bp

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
    
    @app.route('/api/<path:path>', methods=['OPTIONS'])
    def cors_preflight_api(path):
        """Handle OPTIONS requests for all API routes."""
        # Get configured origins from app config
        allowed_origins = app.config.get('CORS_ORIGINS', ["http://localhost:5173"])
        origin = request.headers.get('Origin')
        
        # Create a response that will be returned for OPTIONS requests
        response = make_response()
        
        # Log the CORS preflight for debugging
        app.logger.info(f"CORS preflight request received for path: /api/{path}, Origin: {origin}")
        app.logger.debug(f"Allowed origins: {allowed_origins}")
        
        # Check if the origin is allowed
        if origin and origin in allowed_origins:
            # Add specific origin for proper CORS with credentials (not using wildcard)
            response.headers['Access-Control-Allow-Origin'] = origin
            response.headers['Access-Control-Allow-Credentials'] = 'true'
            
            # Add all configured headers or use defaults
            allowed_headers = app.config.get('CORS_HEADERS', [
                'Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'
            ])
            response.headers['Access-Control-Allow-Headers'] = ', '.join(allowed_headers)
            
            # Add all configured methods or use defaults
            allowed_methods = app.config.get('CORS_METHODS', [
                'GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'
            ])
            response.headers['Access-Control-Allow-Methods'] = ', '.join(allowed_methods)
            
            # Expose headers
            expose_headers = app.config.get('CORS_EXPOSE_HEADERS', [
                'Content-Length', 'Content-Type', 'Authorization'
            ])
            response.headers['Access-Control-Expose-Headers'] = ', '.join(expose_headers)
            
            # Set max age from config or default (24 hours = 86400 seconds)
            max_age = app.config.get('CORS_MAX_AGE', 86400)
            response.headers['Access-Control-Max-Age'] = str(max_age)
            
            # Log success for debugging
            app.logger.info(f"CORS preflight request successful for Origin: {origin}")
            
            # Return 200 OK status for successful preflight
            return response, 200
        else:
            # Log failure for debugging
            app.logger.warning(f"CORS preflight request denied for Origin: {origin}")
            return response, 403

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

def create_app(config_class=Config):
    """Create and configure an instance of the Flask application."""
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    
    # Initialize CORS with specific settings
    CORS(app, 
         resources={r"/api/*": {
             "origins": app.config['CORS_ORIGINS'],
             "methods": app.config['CORS_METHODS'],
             "allow_headers": app.config['CORS_HEADERS'],
             "expose_headers": app.config['CORS_EXPOSE_HEADERS'],
             "supports_credentials": app.config['CORS_SUPPORTS_CREDENTIALS'],
             "max_age": app.config['CORS_MAX_AGE']
         }},
         supports_credentials=True)
    
    # Add CORS headers to all responses
    @app.after_request
    def after_request(response):
        origin = request.headers.get('Origin')
        
        # If this is a CORS request (has Origin header)
        if origin:
            # Check if origin is in allowed origins
            if origin in app.config['CORS_ORIGINS'] or '*' in app.config['CORS_ORIGINS']:
                response.headers.add('Access-Control-Allow-Origin', origin)
                response.headers.add('Access-Control-Allow-Credentials', 'true')
                response.headers.add('Access-Control-Allow-Methods', ','.join(app.config['CORS_METHODS']))
                response.headers.add('Access-Control-Allow-Headers', ','.join(app.config['CORS_HEADERS']))
                response.headers.add('Access-Control-Expose-Headers', ','.join(app.config['CORS_EXPOSE_HEADERS']))
                response.headers.add('Access-Control-Max-Age', str(app.config['CORS_MAX_AGE']))
        
        return response
    
    # Handle preflight requests
    @app.before_request
    def handle_preflight():
        if request.method == 'OPTIONS':
            response = make_response()
            # Set CORS headers only if they don't already exist
            if 'Access-Control-Allow-Origin' not in response.headers:
                response.headers.add('Access-Control-Allow-Origin', request.headers.get('Origin', '*'))
            if 'Access-Control-Allow-Credentials' not in response.headers:
                response.headers.add('Access-Control-Allow-Credentials', 'true')
            if 'Access-Control-Allow-Methods' not in response.headers:
                response.headers.add('Access-Control-Allow-Methods', ','.join(app.config['CORS_METHODS']))
            if 'Access-Control-Allow-Headers' not in response.headers:
                response.headers.add('Access-Control-Allow-Headers', ','.join(app.config['CORS_HEADERS']))
            if 'Access-Control-Max-Age' not in response.headers:
                response.headers.add('Access-Control-Max-Age', str(app.config['CORS_MAX_AGE']))
            return response
    
    # Register blueprints
    app.register_blueprint(api_bp, url_prefix='/api')
    
    # Initialize extensions
    limiter.init_app(app)
    cache.init_app(app)

    # Apply MIME type and Render fixes if available
    if FIXES_AVAILABLE:
        print("Applying fixes for MIME types and Render compatibility...")
        try:
            apply_all_mime_fixes(app)
            if app.config.get('ENV') == 'production' or os.environ.get('APPLY_RENDER_FIXES') == 'true':
                apply_render_fixes(app)
        except Exception as e:
            print(f"WARNING: Error applying fixes: {str(e)}")
            
    # Set up handlers and routes
    setup_error_handlers(app)
    setup_jwt_handlers(app)
    setup_routes(app)

    # Initialize database models
    with app.app_context():
        from .api.models import (
            User, Note, Universe, Physics2D, Physics3D, SoundProfile,
            AudioSample, MusicPiece, Harmony, MusicalTheme, Character
        )

        if app.config.get('ENV') == 'development' and os.environ.get('AUTO_CREATE_TABLES') == 'true':
            db.create_all()
            print("Database tables created automatically (development mode)")
        else:
            print("Skipping automatic table creation. Use setup_db.py to manage database.")

    return app
