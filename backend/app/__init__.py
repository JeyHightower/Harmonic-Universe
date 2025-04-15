from flask import Flask, jsonify, send_from_directory, Response, render_template, current_app, request
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

from .config import config
from .extensions import db
from .api.routes import api_bp
from .api.routes.auth import auth_bp
from .api.routes.user import user_bp
from .api.routes.scenes import scenes_bp
from .api.routes.characters import characters_bp
from .api.routes.notes import notes_bp

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
jwt = JWTManager()
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
    """Configure CORS handling for the application."""
    # Since we're using Flask-CORS extension, we don't need to manually handle OPTIONS requests
    # We'll keep this function minimal to avoid conflicting with the extension
    
    # Handle /api/* OPTIONS requests specifically
    @app.route('/api/<path:path>', methods=['OPTIONS'])
    def cors_preflight(path):
        response = app.make_default_options_response()
        # We don't need to add CORS headers here as Flask-CORS will handle it
        return response, 200

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

def create_app(config_name='default'):
    """Create and configure the Flask application."""
    # Configure static folder
    static_folder = os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', 'frontend', 'dist'))
    static_url_path = '/'

    # Create Flask app
    app = Flask(__name__, static_folder=static_folder, static_url_path=static_url_path)

    # Log static folder configuration
    print(f"Static folder set to: {app.static_folder}")
    print(f"Static URL path set to: {app.static_url_path}")

    # Set up static folder with fallbacks
    setup_static_folder(app)

    # Basic app configuration
    app.url_map.strict_slashes = False
    app.config.from_object(config[config_name])

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    limiter.init_app(app)
    cache.init_app(app)

    # Apply MIME type and Render fixes if available
    if FIXES_AVAILABLE:
        print("Applying fixes for MIME types and Render compatibility...")
        try:
            apply_all_mime_fixes(app)
            if config_name == 'production' or os.environ.get('APPLY_RENDER_FIXES') == 'true':
                apply_render_fixes(app)
        except Exception as e:
            print(f"WARNING: Error applying fixes: {str(e)}")

    # Configure CORS
    @limiter.request_filter
    def options_request_filter():
        return request.method == "OPTIONS"

    exempt_methods = ["OPTIONS"]

    @jwt.token_in_blocklist_loader
    def check_if_token_in_blocklist(jwt_header, jwt_payload):
        if request.method in exempt_methods:
            return False
        return False

    # Apply CORS for all routes, not just /api routes
    CORS(app, 
        origins=app.config['CORS_ORIGINS'], 
        methods=app.config['CORS_METHODS'],
        allow_headers=app.config['CORS_HEADERS'],
        expose_headers=app.config['CORS_EXPOSE_HEADERS'],
        supports_credentials=True,
        max_age=app.config['CORS_MAX_AGE'],
        vary_header=True)
    
    # Log CORS configuration
    print(f"CORS configured with origins: {app.config['CORS_ORIGINS']}")
    print(f"CORS credentials support: {True}")
    
    # Instead, we'll create a simpler after_request handler just for cookies
    @app.after_request
    def fix_cookies(response):
        if 'Set-Cookie' in response.headers:
            # Always set the same consistent cookie settings
            is_prod = app.config.get('ENV') == 'production'
            same_site = 'None'  # Use None for both prod and dev to enable cross-site cookies
            secure = True  # Set secure for both environments since SameSite=None requires it
            
            # Log cookie settings being applied
            print(f"Setting cookie headers - SameSite={same_site}, Secure={secure}, Env={app.config.get('ENV')}")
            
            cookies = response.headers.getlist('Set-Cookie')
            response.headers.pop('Set-Cookie')
            
            for cookie in cookies:
                cookie_parts = cookie.split(';')
                base_cookie = cookie_parts[0]
                
                # Build a new cookie with consistent settings
                new_cookie = f"{base_cookie}; Path=/; HttpOnly; SameSite={same_site}; Secure"
                response.headers.add('Set-Cookie', new_cookie)
                
        # Add CORS headers for pre-flight requests if not already present
        if request.method == 'OPTIONS' and 'Origin' in request.headers:
            # Ensure CORS headers are set for preflight requests
            origin = request.headers.get('Origin')
            allowed_origins = app.config['CORS_ORIGINS']
            
            # Check if origin is allowed (either explicitly or via wildcard)
            is_allowed = '*' in allowed_origins or origin in allowed_origins
            
            if is_allowed:
                if 'Access-Control-Allow-Origin' not in response.headers:
                    response.headers['Access-Control-Allow-Origin'] = origin
                if 'Access-Control-Allow-Credentials' not in response.headers:
                    response.headers['Access-Control-Allow-Credentials'] = 'true'
        
        return response

    # Set up handlers and routes
    setup_cors_handlers(app)
    setup_error_handlers(app)
    setup_jwt_handlers(app)
    setup_routes(app)

    # Register API blueprint
    try:
        app.register_blueprint(api_bp)
    except ImportError as e:
        print(f"Error importing API routes: {e}")

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
