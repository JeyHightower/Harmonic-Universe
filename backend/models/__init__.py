from flask_sqlalchemy import SQLAlchemy


db = SQLAlchemy()


from .enums import AlignmentType
from .associations import character_universes, character_notes
from .users import User
from .universes import Universe
from .characters import Character
from .notes import Note
from utils import get_current_user

__all__ = ['db', 'User', 'Universe', 'AlignmentType', 'Character', 'character_universes', 'character_notes', 'Note']