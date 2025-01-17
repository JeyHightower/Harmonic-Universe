import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_session import Session
from config import config

db = SQLAlchemy()
migrate = Migrate()
sess = Session()

def create_app(config_name='default'):
    """Create Flask application."""
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    CORS(app)
    sess.init_app(app)

    # Create upload folder if it doesn't exist
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    # Register blueprints
    from .routes import auth_routes, universe_routes, music_routes
    app.register_blueprint(auth_routes.bp)
    app.register_blueprint(universe_routes.bp)
    app.register_blueprint(music_routes.bp)

    return app
