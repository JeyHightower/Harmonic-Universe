from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
import os
import sys
import logging
from logging.handlers import RotatingFileHandler
from dotenv import load_dotenv

# Add the current directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Load environment variables
load_dotenv()

# Import db from models
try:
    from app.api.models.database import db
except ImportError:
    print("WARNING: Could not import database module. Will continue without it.")
    from flask_sqlalchemy import SQLAlchemy
    db = SQLAlchemy()

def create_app():
    # Create Flask application with absolute path to static folder
    static_folder_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
    app = Flask(__name__, static_folder=static_folder_path, static_url_path="")
    
    # Print debugging information about static folder
    print(f"Static folder absolute path: {static_folder_path}")
    print(f"Static folder exists: {os.path.exists(static_folder_path)}")
    if os.path.exists(static_folder_path):
        print(f"Static folder contents: {os.listdir(static_folder_path)}")
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            print(f"index.html exists in static folder (size: {os.path.getsize(index_path)} bytes)")
        else:
            print(f"index.html does NOT exist in static folder")

    # Load environment variables
    try:
        app.config.from_object('app.config.Config')
    except Exception as e:
        print(f"Error loading config: {e}")
        # Set minimal default configuration
        app.config.update({
            'SECRET_KEY': os.environ.get('SECRET_KEY', 'dev-key-please-change'),
            'SQLALCHEMY_DATABASE_URI': os.environ.get('DATABASE_URL', 'sqlite:///app.db'),
            'SQLALCHEMY_TRACK_MODIFICATIONS': False,
            'JWT_SECRET_KEY': os.environ.get('JWT_SECRET_KEY', 'jwt-dev-key'),
            'LOG_LEVEL': logging.INFO,
            'LOG_FORMAT': '%(asctime)s %(levelname)s: %(message)s',
            'CORS_ORIGINS': ['*'],
            'CORS_METHODS': ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            'CORS_HEADERS': ['Content-Type', 'Authorization'],
            'CORS_EXPOSE_HEADERS': ['Content-Type', 'Authorization'],
            'CORS_MAX_AGE': 86400,
        })

    # Configure CORS - allow all origins for testing
    CORS(app, resources={r"/*": {"origins": "*", "supports_credentials": True}})

    # Ensure instance directory exists
    instance_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'instance')
    if not os.path.exists(instance_path):
        os.makedirs(instance_path)
        os.chmod(instance_path, 0o777)

    # Configure logging
    if not os.path.exists('logs'):
        os.mkdir('logs')
    file_handler = RotatingFileHandler('logs/app.log', maxBytes=10240, backupCount=10)
    file_handler.setFormatter(logging.Formatter(app.config['LOG_FORMAT']))
    file_handler.setLevel(app.config['LOG_LEVEL'])
    app.logger.addHandler(file_handler)
    app.logger.setLevel(app.config['LOG_LEVEL'])
    app.logger.info('Application startup')

    # Initialize extensions
    db.init_app(app)
    try:
        migrate = Migrate(app, db)
        jwt = JWTManager(app)
    
        # Import models (after db initialization)
        from app.api.models import (
            AudioSample, Character, Harmony, MusicPiece, MusicalTheme,
            Note, Physics2D, Physics3D, PhysicsConstraint, PhysicsObject,
            Scene, SoundProfile, Universe, User
        )
    
        # Import routes (after model imports)
        from app.api.routes.characters import characters_bp
        from app.api.routes.notes import notes_bp
        from app.api.routes.auth import auth_bp
        from app.api.routes.user import user_bp
        from app.api.routes.universes import universes_bp
    
        # Register blueprints
        app.register_blueprint(characters_bp, url_prefix='/api/characters')
        app.register_blueprint(notes_bp, url_prefix='/api/notes')
        app.register_blueprint(auth_bp, url_prefix='/api/auth')
        app.register_blueprint(user_bp, url_prefix='/api/user')
        app.register_blueprint(universes_bp, url_prefix='/api/universes')
    
        # Create database tables
        with app.app_context():
            try:
                db.create_all()
                app.logger.info('Database tables created successfully')
            except Exception as e:
                app.logger.error(f'Error creating database tables: {e}')
                print(f"Error creating database tables: {e}")
    except Exception as e:
        app.logger.error(f"Error setting up database and routes: {e}")
        print(f"Error setting up database and routes: {e}")

    # Add health check endpoint
    @app.route('/api/health')
    def health_check():
        return jsonify({"status": "healthy", "message": "API is running"}), 200

    # Debug endpoint to check static files
    @app.route('/api/debug/static')
    def debug_static():
        static_folder = app.static_folder
        files = os.listdir(static_folder) if os.path.exists(static_folder) else []
        
        index_content = ""
        if os.path.exists(os.path.join(static_folder, 'index.html')):
            with open(os.path.join(static_folder, 'index.html'), 'r') as f:
                index_content = f.read()[:100] + "..." if len(f.read()) > 100 else f.read()
        
        return jsonify({
            "static_folder": static_folder,
            "static_url_path": app.static_url_path,
            "static_folder_exists": os.path.exists(static_folder),
            "files": files,
            "index_exists": "index.html" in files,
            "index_preview": index_content
        }), 200

    # Explicitly serve test.html for testing static file serving
    @app.route('/test')
    def test_page():
        try:
            app.logger.info('Serving test.html from static folder')
            return send_from_directory(app.static_folder, 'test.html')
        except Exception as e:
            app.logger.error(f'Error serving test.html: {e}')
            return f"Error: {str(e)}", 500

    # Direct serve function for any file in static
    @app.route('/staticfile/<path:filename>')
    def send_file(filename):
        return send_from_directory(app.static_folder, filename)

    # Serve static files from the root URL
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def catch_all(path):
        # Log the requested path
        app.logger.info(f'Catch-all route accessed with path: {path}')
        
        # Exclude API routes from this handling
        if path.startswith('api/'):
            app.logger.info(f'API path detected: {path}')
            return jsonify({
                'error': 'Not Found',
                'message': f'API endpoint /{path} not found'
            }), 404
        
        # Try to serve as a static file first
        try:
            if path and os.path.exists(os.path.join(app.static_folder, path)):
                app.logger.info(f'Serving static file: {path}')
                return send_from_directory(app.static_folder, path)
                
            # If path is empty or file doesn't exist, serve index.html
            app.logger.info(f'Static file not found, serving index.html instead')
            if os.path.exists(os.path.join(app.static_folder, 'index.html')):
                return send_from_directory(app.static_folder, 'index.html')
            else:
                app.logger.error('index.html not found in static folder')
                return jsonify({
                    "error": "Missing index.html",
                    "message": "The index.html file could not be found in the static folder"
                }), 500
        except Exception as e:
            app.logger.error(f'Error in catch_all route: {e}')
            return jsonify({
                "error": "Server Error",
                "message": str(e)
            }), 500

    return app

# Create the application instance
app = create_app()

# Error handlers
@app.errorhandler(404)
def not_found(error):
    app.logger.warning(f'Not Found: {request.url}')
    # Return index.html for non-API routes to support client-side routing
    if not request.path.startswith('/api/'):
        try:
            app.logger.info(f'Serving index.html for 404 path: {request.path}')
            return send_from_directory(app.static_folder, 'index.html')
        except Exception as e:
            app.logger.error(f'Error serving index.html for 404: {e}')
            return jsonify({
                "error": "Not Found",
                "message": f"Path not found and could not serve index.html: {str(e)}"
            }), 500
    
    return jsonify({
        'error': 'Not Found',
        'message': 'The requested resource was not found'
    }), 404

@app.errorhandler(500)
def server_error(error):
    app.logger.error(f'Server Error: {str(error)}')
    return jsonify({
        'error': 'Internal Server Error',
        'message': 'An unexpected error occurred'
    }), 500

# Run the application
if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5001)
