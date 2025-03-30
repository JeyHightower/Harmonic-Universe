from flask import Flask, jsonify
from flask_cors import CORS
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
import os
import sys

# Add the current directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import db from models
from app.api.models.database import db

def create_app():
    # Create Flask application
    app = Flask(__name__, static_folder="static")

    # Configure CORS
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # Load environment variables
    app.config.from_object('app.config.Config')

    # Configure SQLAlchemy
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

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

    # Register blueprints
    app.register_blueprint(characters_bp, url_prefix='/api/characters')
    app.register_blueprint(notes_bp, url_prefix='/api/notes')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')

    # Create database tables
    with app.app_context():
        db.create_all()

    return app

# Create the application instance
app = create_app()

# Health check endpoint
@app.route('/api/health')
def health_check():
    return jsonify({
        'status': 'healthy',
        'message': 'The Harmonic Universe API is running'
    })

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'error': 'Not Found',
        'message': 'The requested resource was not found'
    }), 404

@app.errorhandler(500)
def server_error(error):
    return jsonify({
        'error': 'Internal Server Error',
        'message': 'An unexpected error occurred'
    }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)
