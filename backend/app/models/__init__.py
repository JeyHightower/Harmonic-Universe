from app.extensions import db

# Import models
from .user import User
from .universe import Universe
from .music_parameter import MusicParameter
from .physics_parameter import PhysicsParameter
from .storyboard import Storyboard

__all__ = ['db', 'User', 'Universe', 'MusicParameter', 'PhysicsParameter', 'Storyboard']

def init_models():
    """Initialize any model-specific configurations if needed"""
    pass
