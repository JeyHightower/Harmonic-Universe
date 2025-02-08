from flask import Flask
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO
from flask_bcrypt import Bcrypt
from config import Config
import os
import logging
from .db.session import init_engine, Base

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize extensions
migrate = Migrate()
jwt = JWTManager()
socketio = SocketIO()
bcrypt = Bcrypt()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Load the .env file
    from dotenv import load_dotenv
    load_dotenv()

    # Initialize database
    database_url = app.config['SQLALCHEMY_DATABASE_URI']
    logger.debug(f"Using database URL: {database_url}")

    # Initialize database engine with the Flask config URL
    engine = init_engine(database_url)

    # Create all tables
    Base.metadata.create_all(bind=engine)

    # Initialize extensions
    migrate.init_app(app, Base)
    jwt.init_app(app)
    bcrypt.init_app(app)
    CORS(app)
    socketio.init_app(app, cors_allowed_origins="*")

    # Register blueprints
    from app.api.routes import (
        auth_bp,
        universe_bp,
        audio_bp,
        visualization_bp,
        physics_bp,
        ai_bp
    )

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(universe_bp, url_prefix='/api/universes')
    app.register_blueprint(audio_bp, url_prefix='/api/audio')
    app.register_blueprint(visualization_bp, url_prefix='/api/visualizations')
    app.register_blueprint(physics_bp, url_prefix='/api/physics')
    app.register_blueprint(ai_bp, url_prefix='/api/ai')

    # Register error handlers
    from app.core.errors import register_error_handlers
    register_error_handlers(app)

    @app.route('/health')
    def health_check():
        return {'status': 'healthy'}

    # Create demo user on app startup
    with app.app_context():
        from .seeds.demo_user import create_demo_user
        create_demo_user()

    return app
