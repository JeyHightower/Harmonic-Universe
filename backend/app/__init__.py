"""Flask application factory."""
from flask import Flask, jsonify
from flask_mail import Mail
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_marshmallow import Marshmallow
from flask_cors import CORS
from .config import Config, DevelopmentConfig, TestingConfig, ProductionConfig
from .extensions import migrate, jwt, socketio, cache, db, init_app
from .utils.error_handlers import register_error_handlers
import redis
from dotenv import load_dotenv
import os
from flask_login import LoginManager
from .models import User, Profile, Universe, Storyboard, Scene
import logging

# Load environment variables
load_dotenv(override=True)

# Initialize extensions
mail = Mail()
ma = Marshmallow()
redis_client = None
login_manager = LoginManager()

@login_manager.user_loader
def load_user(user_id):
    """Load user by ID."""
    return User.query.get(int(user_id))

def init_extensions(app):
    """Initialize Flask extensions."""
    db.init_app(app)
    jwt.init_app(app)
    mail.init_app(app)
    ma.init_app(app)
    CORS(app)
    migrate.init_app(app, db)
    socketio.init_app(app)
    login_manager.init_app(app)

def create_app(config_name='development'):
    """Create and configure the Flask application."""
    app = Flask(__name__)

    # Configure logging
    logging.basicConfig(
        level=logging.DEBUG,
        format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
    )
    app.logger.setLevel(logging.INFO)

    # Load configuration
    if config_name == 'development':
        app.config.from_object(DevelopmentConfig)
    elif config_name == 'testing':
        app.config.from_object(TestingConfig)
    elif config_name == 'production':
        app.config.from_object(ProductionConfig)
    else:
        app.config.from_object(Config)

    # Initialize extensions
    init_extensions(app)

    # Register blueprints
    from .routes.auth import bp as auth_bp
    from .routes.universe import bp as universe_bp
    from .routes.media_effect_routes import media_effects
    app.register_blueprint(auth_bp)
    app.register_blueprint(universe_bp, url_prefix='/api')
    app.register_blueprint(media_effects)

    # Initialize Redis if not testing
    if config_name != 'testing':
        global redis_client
        redis_client = redis.from_url(app.config['REDIS_URL'])

    # Register error handlers
    register_error_handlers(app)

    # Import all models to ensure they're registered with SQLAlchemy
    from .models import User, Profile, Universe, Storyboard, Scene  # noqa

    app.logger.info("Application initialization completed")

    return app
