"""Database models for the application."""
from flask_sqlalchemy import SQLAlchemy

# Create the SQLAlchemy instance
db = SQLAlchemy()

def init_db(app):
    """Initialize the database with the app context."""
    db.init_app(app)

# Import models after db instance is created
from .user import User
from .profile import Profile
from .universe import Universe
from .physics_parameters import PhysicsParameters

__all__ = [
    'db',
    'init_db',
    'User',
    'Profile',
    'Universe',
    'PhysicsParameters'
]

