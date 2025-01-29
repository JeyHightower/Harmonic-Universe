"""Database models for the application."""
from ..extensions import db

def init_db(app):
    """Initialize the database with the app context."""
    with app.app_context():
        # Import models
        from .user import User
        from .universe import Universe

        # Set up relationships after models are initialized
        from .relationships import setup_user_universe_relationships
        setup_user_universe_relationships(User, Universe)

        # Create all tables
        db.create_all()

# Import models for external use
from .association_tables import universe_collaborators, universe_access
from .user import User
from .universe import Universe

__all__ = [
    'db',
    'init_db',
    'User',
    'Universe',
    'universe_collaborators',
    'universe_access'
]

