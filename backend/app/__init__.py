from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
import os

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()

def create_app(test_config=None):
    app = Flask(__name__, static_folder="static")
    
    # Default configuration
    app.config.from_mapping(
        SECRET_KEY=os.environ.get("SECRET_KEY", "dev-key-for-testing"),
        SQLALCHEMY_DATABASE_URI="sqlite:///app.db",
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
    )

    # Override config with test config if passed
    if test_config is not None:
        app.config.update(test_config)

    # Initialize extensions with app
    db.init_app(app)
    migrate.init_app(app, db)

    # Configure CORS with specific settings
    CORS(app, resources={
        r"/api/*": {
            "origins": "*",
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type"]
        }
    })

    # Register blueprints
    from .api.routes.characters import characters_bp
    from .api.routes.notes import notes_bp
    
    app.register_blueprint(characters_bp)
    app.register_blueprint(notes_bp)

    return app
