from flask import Flask, jsonify, request
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
    app = Flask(__name__, static_folder="static")

    # Load environment variables
    app.config.from_object('app.config.Config')

    # Configure CORS
    CORS(app, resources={r"/*": {"origins": ["http://localhost:5173", "http://localhost:3000", "http://localhost:5174", "http://localhost:5175", "http://127.0.0.1:5173", "http://127.0.0.1:3000"], "supports_credentials": True}})

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

    return app

# Create the application instance
app = create_app()

# Error handlers
@app.errorhandler(404)
def not_found(error):
    app.logger.warning(f'Not Found: {request.url}')
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
