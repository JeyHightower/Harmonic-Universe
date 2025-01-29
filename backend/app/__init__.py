"""Flask application factory."""
from flask import Flask
from flask_mail import Mail
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_marshmallow import Marshmallow
from flask_cors import CORS
from .config import config
from .extensions import migrate, jwt, socketio, cache, db, init_app
from .utils.error_handlers import register_error_handlers
import redis
from dotenv import load_dotenv
import os
from flask_login import LoginManager
from .models import User
from .routes import (
    auth_routes,
    user_routes,
    universe_routes,
    storyboard_routes,
    scene_routes,
    media_effect_routes,
)

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

def create_app(config_name='development'):
    """Create and configure an instance of the Flask application."""
    app = Flask(__name__, instance_relative_config=True)

    # Ensure instance folder exists
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass

    # Load config based on environment
    if config_name == 'production':
        app.config.from_object('backend.app.config.ProductionConfig')
    elif config_name == 'testing':
        app.config.from_object('backend.app.config.TestingConfig')
    else:
        app.config.from_object('backend.app.config.DevelopmentConfig')

    # Override with environment variables if set
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', app.config.get('SECRET_KEY'))
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', app.config.get('JWT_SECRET_KEY'))

    # Initialize logging
    config[config_name].init_logging(app)
    app.logger.info(f'Starting application in {config_name} mode')

    # Initialize extensions
    init_app(app)
    mail.init_app(app)
    ma.init_app(app)
    CORS(app)
    db.init_app(app)
    login_manager.init_app(app)
    Migrate(app, db)

    # Initialize models and relationships
    from .models import init_db
    init_db(app)

    # Register error handlers
    register_error_handlers(app)

    # Register blueprints
    app.register_blueprint(auth_routes.bp)
    app.register_blueprint(user_routes.bp)
    app.register_blueprint(universe_routes.bp)
    app.register_blueprint(storyboard_routes.bp)
    app.register_blueprint(scene_routes.bp)
    app.register_blueprint(media_effect_routes.bp)

    # Additional JWT configuration
    @jwt.user_lookup_loader
    def user_lookup_callback(_jwt_header, jwt_data):
        """Look up user from JWT data."""
        from .models import User
        identity = jwt_data["sub"]
        return User.query.get(identity)

    app.logger.info('Application initialization completed')
    return app
