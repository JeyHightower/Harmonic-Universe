from flask import Flask, jsonify, send_from_directory, Response, render_template, current_app, request
from flask_cors import CORS
from flask_migrate import Migrate
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_jwt_extended import JWTManager
try:
    from flask_caching import Cache
    has_flask_caching = True
except ImportError:
    print("WARNING: flask_caching not found, caching will be disabled")
    has_flask_caching = False
import os
from pathlib import Path
from typing import Optional, Union, cast, Any
from .config import config
from .extensions import db
from .api.routes import api_bp
from .api.routes.auth import auth_bp
from .api.routes.user import user_bp
from .api.routes.scenes import scenes_bp
from .api.routes.characters import characters_bp
from .api.routes.notes import notes_bp
import click
import logging
from logging.handlers import RotatingFileHandler

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
limiter = Limiter(key_func=get_remote_address)
if has_flask_caching:
    cache = Cache()
else:
    # Create a dummy cache object
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
    
    cache = DummyCache()

def create_app(config_name='default'):
    # For deployment, we use the frontend/dist folder for static files
    static_folder = os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', 'frontend', 'dist'))
    static_url_path = '/'
    
    # Create the Flask app with the correct static folder configuration
    app = Flask(__name__, static_folder=static_folder, static_url_path=static_url_path)
    
    # Print debugging information about static folder
    print(f"Static folder set to: {app.static_folder}")
    print(f"Static URL path set to: {app.static_url_path}")
    
    # Check if the static folder exists and has the necessary files
    if os.path.exists(static_folder):
        try:
            static_files = os.listdir(static_folder)
            print(f"Static folder contains {len(static_files)} files")
            if 'index.html' in static_files:
                print(f"index.html exists (size: {os.path.getsize(os.path.join(static_folder, 'index.html'))} bytes)")
            else:
                print("WARNING: index.html not found in static folder")
        except Exception as e:
            print(f"Error inspecting static folder: {str(e)}")
    else:
        print(f"WARNING: Static folder does not exist at {static_folder}")
        # Try alternative locations based on environment variables
        possible_static_folders = [
            os.environ.get('STATIC_FOLDER'),  # Try environment variable
            os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', 'static')),  # Project root static
            os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static')),  # Backend static
            '/opt/render/project/src/static',  # Render.com deployment path
            '/opt/render/project/src/backend/static'  # Alternative Render.com path
        ]
        
        for folder in possible_static_folders:
            if folder and os.path.exists(folder) and os.path.isdir(folder):
                app.static_folder = folder
                print(f"Using alternative static folder: {app.static_folder}")
                break
    
    # Disable trailing slash redirects
    app.url_map.strict_slashes = False
    
    # Load config
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    migrate = Migrate(app, db)  # Initialize Flask-Migrate
    jwt.init_app(app)
    limiter.init_app(app)
    cache.init_app(app)
    
    # Apply MIME type and Render fixes if available
    if FIXES_AVAILABLE:
        print("Applying fixes for MIME types and Render compatibility...")
        try:
            apply_all_mime_fixes(app)
            # Only apply Render fixes in production
            if config_name == 'production' or os.environ.get('APPLY_RENDER_FIXES') == 'true':
                apply_render_fixes(app)
        except Exception as e:
            print(f"WARNING: Error applying fixes: {str(e)}")
    
    # Exempt OPTIONS requests from rate limiting globally
    @limiter.request_filter
    def options_request_filter():
        return request.method == "OPTIONS"
    
    # Exempt OPTIONS requests from JWT verification
    exempt_methods = ["OPTIONS"]
    
    @jwt.token_in_blocklist_loader
    def check_if_token_in_blocklist(jwt_header, jwt_payload):
        # Always let OPTIONS requests through
        if request.method in exempt_methods:
            return False
        # Check if token is in blocklist (implementation depends on your needs)
        return False  # Placeholder - replace with actual blocklist check if needed
    
    # Configure CORS
    CORS(app, resources={
        r"/api/*": {
            "origins": app.config['CORS_ORIGINS'],
            "methods": app.config['CORS_METHODS'],
            "allow_headers": app.config['CORS_HEADERS'],
            "expose_headers": app.config['CORS_EXPOSE_HEADERS'],
            "max_age": app.config['CORS_MAX_AGE'],
            "supports_credentials": True,
            "allow_credentials": True
        }
    })
    
    # Make sure OPTIONS requests are not intercepted by JWT validation
    @app.before_request
    def handle_preflight():
        if request.method == "OPTIONS":
            # No need to use limiter.exempt here as we'll configure it globally
            response = app.make_default_options_response()
            origin = request.headers.get('Origin', '')
            
            # For credentials to work, we can't use '*' - we must specify the exact origin
            if origin and origin in app.config['CORS_ORIGINS']:
                response.headers.add('Access-Control-Allow-Origin', origin)
            elif origin:
                # Allow the origin if specified, needed for production cross-origin requests
                response.headers.add('Access-Control-Allow-Origin', origin)
                if app.config.get('CORS_SUPPORTS_CREDENTIALS', False):
                    response.headers.add('Access-Control-Allow-Credentials', 'true')
            elif app.config['CORS_ORIGINS']:
                # Fallback to the first configured origin if available
                response.headers.add('Access-Control-Allow-Origin', app.config['CORS_ORIGINS'][0])
            else:
                # Last resort fallback
                response.headers.add('Access-Control-Allow-Origin', '*')
            
            response.headers.add('Access-Control-Allow-Methods', ', '.join(app.config['CORS_METHODS']))
            response.headers.add('Access-Control-Allow-Headers', ', '.join(app.config['CORS_HEADERS']))
            response.headers.add('Access-Control-Max-Age', str(app.config['CORS_MAX_AGE']))
            
            if app.config.get('CORS_SUPPORTS_CREDENTIALS', False):
                response.headers.add('Access-Control-Allow-Credentials', 'true')
            
            return response

    # Add an OPTIONS route handler to enable CORS preflight on all API routes
    @app.route('/api/<path:path>', methods=['OPTIONS'])
    def cors_preflight(path):
        response = app.make_default_options_response()
        # Add explicit CORS headers for preflight requests
        origin = request.headers.get('Origin', '')
        
        # For credentials to work, we can't use '*' - we must specify the exact origin
        if origin:
            response.headers.add('Access-Control-Allow-Origin', origin)
        else:
            # Fallback to the first configured origin if available, otherwise use '*'
            response.headers.add('Access-Control-Allow-Origin', app.config['CORS_ORIGINS'][0] if app.config['CORS_ORIGINS'] else '*')
            
        response.headers.add('Access-Control-Allow-Methods', ', '.join(app.config['CORS_METHODS']))
        response.headers.add('Access-Control-Allow-Headers', ', '.join(app.config['CORS_HEADERS']))
        response.headers.add('Access-Control-Max-Age', str(app.config['CORS_MAX_AGE']))
        if app.config.get('CORS_SUPPORTS_CREDENTIALS', False):
            response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response, 200
    
    # Register API blueprint
    try:
        app.register_blueprint(api_bp)
    except ImportError as e:
        print(f"Error importing API routes: {e}")
    
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
    
    # Import models to ensure they are registered with SQLAlchemy
    # Note: Tables are not created here anymore. Use setup_db.py instead.
    with app.app_context():
        # Import all models to ensure they are registered with SQLAlchemy
        from .api.models import (
            User, Note, Universe, Physics2D, Physics3D, SoundProfile,
            AudioSample, MusicPiece, Harmony, MusicalTheme, Character
        )
        
        # Only create tables in development mode when explicitly requested
        if app.config.get('ENV') == 'development' and os.environ.get('AUTO_CREATE_TABLES') == 'true':
            db.create_all()
            print("Database tables created automatically (development mode)")
        else:
            print("Skipping automatic table creation. Use setup_db.py to manage database.")
    
    # JWT error handlers
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({
            'message': 'The token has expired',
            'error': 'token_expired'
        }), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        # Log the error in production for debugging 
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
    
    # Serve favicon.ico
    @app.route('/favicon.ico')
    def favicon() -> Response:
        return send_from_directory(
            cast(str, app.static_folder),
            'favicon.ico',
            mimetype='image/vnd.microsoft.icon'
        )
    
    # Add a debug endpoint to check static files
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
    
    # Serve index.html for all non-API routes to support SPA routing
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def react_root(path: str = '') -> Union[Response, tuple[Response, int]]:
        """Serve React App for any non-API routes to support client-side routing."""
        # Check if requesting an API route
        if path.startswith('api/'):
            return jsonify({"error": "Not found"}), 404
            
        # Handle request for favicon.ico
        if path == 'favicon.ico':
            return send_from_directory(cast(str, app.static_folder), 'favicon.ico')
        
        # For all other routes, serve the index.html file for the React SPA
        return app.send_static_file('index.html')
    
    return app
