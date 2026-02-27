from flask_sqlalchemy import SQLAlchemy


db = SQLAlchemy()


from .enums import AlignmentType, LocationType
from .associations import character_universes, character_notes, note_universes, character_locations, location_notes
from .users import User
from .universes import Universe
from .characters import Character
from .notes import Note
from .locations import Location
from .token_blocklist import TokenBlocklist
from utils import get_current_user

__all__ = ['db', 'User', 'Universe', 'AlignmentType','LocationType', 'Character', 'character_universes', 'character_notes', 'Note', 'Location', 'note_universes', 'character_locations', 'location_notes', 'TokenBlocklist']