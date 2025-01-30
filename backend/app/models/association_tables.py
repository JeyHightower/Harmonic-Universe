"""Association tables for many-to-many relationships."""
from sqlalchemy import Column, Integer, ForeignKey, Table
from .. import db

# Association table for universe collaborators
universe_collaborators = Table(
    'universe_collaborators',
    db.Model.metadata,
    Column('universe_id', Integer, ForeignKey('universes.id'), primary_key=True),
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
    extend_existing=True
)

# Association table for universe access
universe_access = Table(
    'universe_access',
    db.Model.metadata,
    Column('universe_id', Integer, ForeignKey('universes.id'), primary_key=True),
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
    extend_existing=True
)
