from flask_sqlalchemy import SQLAlchemy


db = SQLAlchemy()


from .enums import AlignmentType
from .associations import users_universes
from .users import User
from .universes import Universe
from .associations import users_universes

__all__ = ['db', 'User', 'Universe', 'AlignmentType']