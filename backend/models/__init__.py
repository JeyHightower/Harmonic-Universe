from flask_sqlalchemy import SQLAlchemy


db = SQLAlchemy()


from .enums import AlignmentType
from .associations import character_universes
from .users import User
from .universes import Universe
from .characters import Character
from utils import get_current_user

__all__ = ['db', 'User', 'Universe', 'AlignmentType', 'Character', 'character_universes']