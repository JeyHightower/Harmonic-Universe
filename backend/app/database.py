"""Database configuration for the application."""
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

# Initialize SQLAlchemy
db = SQLAlchemy()

def init_db(app):
    """Initialize database with application context."""
    db.init_app(app)

    # Initialize Flask-Migrate
    migrate = Migrate(app, db)

    # Import models here to ensure they are registered with SQLAlchemy
    from .models import (
        User,
        Universe,
        PhysicsParameters,
        MusicParameters,
        VisualizationParameters,
        Comment,
        Favorite,
        Storyboard,
        Version,
        Template
    )

    # Create tables if they don't exist
    with app.app_context():
        db.create_all()
