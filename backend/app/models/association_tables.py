"""Association tables for model relationships."""
from . import db

# Association tables
universe_collaborators = db.Table(
    'universe_collaborators',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id', ondelete="CASCADE"), primary_key=True),
    db.Column('universe_id', db.Integer, db.ForeignKey('universes.id', ondelete="CASCADE"), primary_key=True)
)

universe_access = db.Table(
    'universe_access',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id', ondelete="CASCADE"), primary_key=True),
    db.Column('universe_id', db.Integer, db.ForeignKey('universes.id', ondelete="CASCADE"), primary_key=True)
)
