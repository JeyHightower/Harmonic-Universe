from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
import os
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app_init")

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()

def create_app():
    """Application factory function"""
    app = Flask(__name__)

    # Set up logging
    app.logger.setLevel(logging.INFO)

    # Configure app
    app.config.update(
        SECRET_KEY=os.environ.get('SECRET_KEY', 'dev-key'),
        SQLALCHEMY_DATABASE_URI=os.environ.get('DATABASE_URL', 'sqlite:///app.db'),
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
    )

    # Initialize extensions with better error handling
    try:
        db.init_app(app)
        migrate.init_app(app, db)
        app.logger.info("Database extensions initialized successfully")
    except Exception as e:
        app.logger.error(f"Failed to initialize database extensions: {str(e)}")

    # Ensure instance folder exists
    try:
        os.makedirs(app.instance_path, exist_ok=True)
    except OSError:
        pass

    # Register routes
    @app.route('/')
    def index():
        return jsonify({'message': 'Welcome to Harmonic Universe API'})

    @app.route('/api/health')
    def health():
        # Check database connection
        db_health = "healthy"
        db_error = None
        try:
            with app.app_context():
                db.engine.execute("SELECT 1")
        except Exception as e:
            db_health = "unhealthy"
            db_error = str(e)

        return jsonify({
            'status': 'healthy',
            'database': db_health,
            'database_error': db_error
        })

    # Register blueprints
    try:
        from app.auth import auth_bp
        app.register_blueprint(auth_bp)
        app.logger.info("Registered auth blueprint")
    except Exception as e:
        app.logger.error(f"Failed to register auth blueprint: {str(e)}")

    return app
