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
from app.api.models.database import db

def create_app():
    # Create Flask application
    app = Flask(__name__, static_folder="static", static_url_path="")
    
    # Print debugging information about static folder
    static_folder_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
    print(f"Static folder path: {static_folder_path}")
    print(f"Static folder exists: {os.path.exists(static_folder_path)}")
    if os.path.exists(static_folder_path):
        print(f"Static folder contents: {os.listdir(static_folder_path)}")
        if os.path.exists(os.path.join(static_folder_path, 'index.html')):
            print(f"index.html exists in static folder")
        else:
            print(f"index.html does NOT exist in static folder")

    # Load environment variables
    app.config.from_object('app.config.Config')

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
            raise e

    # Add health check endpoint
    @app.route('/api/health')
    def health_check():
        return jsonify({"status": "healthy", "message": "API is running"}), 200

    # Debug endpoint to check static files
    @app.route('/api/debug/static')
    def debug_static():
        static_folder = app.static_folder
        static_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), static_folder)
        files = os.listdir(static_path) if os.path.exists(static_path) else []
        
        return jsonify({
            "static_folder": static_folder,
            "static_url_path": app.static_url_path,
            "static_path_exists": os.path.exists(static_path),
            "files": files,
            "index_exists": "index.html" in files,
        }), 200

    # Explicitly serve test.html for testing static file serving
    @app.route('/test')
    def test_page():
        return app.send_static_file('test.html')

    # Serve static files from the root URL
    @app.route('/')
    def index():
        app.logger.info('Serving index.html from static folder')
        try:
            return app.send_static_file('index.html')
        except Exception as e:
            app.logger.error(f'Error serving index.html: {e}')
            return jsonify({
                "error": "Failed to serve index.html",
                "message": str(e)
            }), 500

    # Catch-all route for client-side routing to return index.html
    @app.route('/<path:path>')
    def catch_all(path):
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
            app.logger.info(f'Attempting to serve static file: {path}')
            return app.send_static_file(path)
        except Exception as e:
            app.logger.info(f'Static file not found, serving index.html instead. Error: {str(e)}')
            # If not a static file, return index.html to support client-side routing
            return app.send_static_file('index.html')

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
            return app.send_static_file('index.html')
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
