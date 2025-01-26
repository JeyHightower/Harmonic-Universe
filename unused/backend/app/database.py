"""Database configuration for the application."""
from flask_migrate import Migrate
from .extensions import db


def init_db(app):
    """Initialize database with application context."""
    # Initialize Flask-Migrate
    migrate = Migrate(app, db)

    # Import models here to ensure they are registered with SQLAlchemy

    # Create tables if they don't exist
    with app.app_context():
        db.create_all()
