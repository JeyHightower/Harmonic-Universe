from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

# Import and expose models
from .user import User
from .universe import Universe
from .physics_parameter import PhysicsParameter
from .music_parameter import MusicParameter
from .storyboard import Storyboard

__all__ = ['db', 'User', 'Universe', 'PhysicsParameter', 'MusicParameter', 'Storyboard']

def init_models():
    """Initialize any model-specific configurations if needed"""
    pass
