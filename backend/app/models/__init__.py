"""Models package."""
from ..extensions import db

__all__ = [
    'User',
    'Profile',
    'Universe',
    'Storyboard',
    'Scene',
    'VisualEffect',
    'AudioTrack',
    'PhysicsObject',
    'PhysicsConstraint',
    'universe_collaborators'
]

# Import models after db to avoid circular imports
from .user import User
from .profile import Profile
from .universe import Universe, universe_collaborators
from .storyboard import Storyboard
from .scene import Scene
from .media_effects import VisualEffect, AudioTrack
from .physics_object import PhysicsObject
from .physics_constraint import PhysicsConstraint

