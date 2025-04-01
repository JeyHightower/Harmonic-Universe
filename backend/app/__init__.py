from flask import Flask, jsonify, send_from_directory, Response
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
from typing import Optional, Union
from .config import config
from .extensions import db

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
    app = Flask(__name__)
    
    # Set the static folder to the backend/static directory
    static_folder = os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static'))
    print(f"Setting static folder to: {static_folder}")
    app.static_folder = static_folder
    app.static_url_path = ''
    
    # Print debugging information
    if os.path.exists(static_folder):
        print(f"Static folder exists and contains: {os.listdir(static_folder)}")
        index_path = os.path.join(static_folder, 'index.html')
        if os.path.exists(index_path):
            print(f"index.html exists (size: {os.path.getsize(index_path)} bytes)")
        else:
            print("WARNING: index.html not found in static folder")
    else:
        print(f"WARNING: Static folder does not exist at {static_folder}")
    
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
    try:
        from .api.routes import api_bp
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
        return send_from_directory(
            app.static_folder,
            'favicon.ico',
            mimetype='image/vnd.microsoft.icon'
        )
    
    # Add a debug endpoint to check static files
    @app.route('/api/debug/static')
    def debug_static():
        files = []
        if os.path.exists(app.static_folder):
            for root, dirs, filenames in os.walk(app.static_folder):
                for filename in filenames:
                    file_path = os.path.join(root, filename)
                    rel_path = os.path.relpath(file_path, app.static_folder)
                    files.append({
                        'path': rel_path,
                        'size': os.path.getsize(file_path)
                    })
        
        return jsonify({
            'static_folder': app.static_folder,
            'static_url_path': app.static_url_path,
            'files': files,
            'static_folder_exists': os.path.exists(app.static_folder)
        })
    
    # Serve index.html for all non-API routes
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve(path: str = '') -> Response:
        # Check if requesting an API route
        if path.startswith('api/'):
            return jsonify({"error": "Not found"}), 404
            
        # Try to serve the file directly if it exists
        if path and os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        
        # Default to index.html for client-side routing
        return send_from_directory(app.static_folder, 'index.html')
    
    return app
