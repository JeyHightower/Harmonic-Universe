from flask import Flask, jsonify
from flask_cors import CORS
from flask_migrate import Migrate
import os
import sys

# Add the current directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import db from models
from app.api.models import db

def create_app():
    # Create Flask application
    app = Flask(__name__, static_folder="static")

    # Configure CORS
    CORS(app)

    # Load environment variables
    if os.path.exists('.env'):
        from dotenv import load_dotenv
        load_dotenv()

    # Handle Render.com PostgreSQL URL format
    database_url = os.environ.get('DATABASE_URL')
    if database_url and database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    else:
        # Default to a local SQLite database for development if no DATABASE_URL is provided
        database_url = os.environ.get('DATABASE_URL') or f'sqlite:///{os.path.join(os.path.dirname(os.path.abspath(__file__)), "instance", "app.db")}'

    # Configure app and database
    app.config.from_mapping(
        SECRET_KEY=os.environ.get('SECRET_KEY', 'dev'),
        SQLALCHEMY_DATABASE_URI=database_url,
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        SQLALCHEMY_ENGINE_OPTIONS={
            'pool_size': 5,
            'max_overflow': 2,
            'pool_timeout': 30,
            'pool_recycle': 1800,
        }
    )

    # Initialize extensions
    db.init_app(app)
    migrate = Migrate(app, db)

    # Import models (after db initialization)
    from app.api.models import (
        AudioSample, Character, Harmony, MusicPiece, MusicalTheme,
        Note, Physics2D, Physics3D, PhysicsConstraint, PhysicsObject,
        PhysicsParameter, Scene, SoundProfile, Universe, User
    )

    # Import routes (after model imports)
    from app.api.routes.characters import characters_bp
    from app.api.routes.notes import notes_bp

    # Register blueprints
    app.register_blueprint(characters_bp)
    app.register_blueprint(notes_bp)

    # Health check route
    @app.route('/api/health')
    def health_check():
        try:
            db.session.execute('SELECT 1')
            db_status = "connected"
        except Exception as e:
            db_status = f"disconnected: {str(e)}"
        
        return jsonify({
            "status": "healthy",
            "version": "1.0.0",
            "database": db_status
        }), 200

    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            "error": "Not Found",
            "message": str(error)
        }), 404

    @app.errorhandler(500)
    def server_error(error):
        return jsonify({
            "error": "Internal Server Error",
            "message": str(error)
        }), 500

    return app

app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
