"""Relationship definitions between models."""
from . import db
from .association_tables import universe_collaborators, universe_access

# User-Universe relationships
def setup_user_universe_relationships(User, Universe):
    """Set up relationships between User and Universe models."""
    User.owned_universes = db.relationship(
        Universe,
        primaryjoin='User.id == Universe.user_id',
        backref=db.backref('owner', passive_deletes=True),
        lazy='dynamic',
        passive_deletes=True
    )

    User.collaborating_universes = db.relationship(
        Universe,
        secondary=universe_collaborators,
        primaryjoin='User.id == universe_collaborators.c.user_id',
        secondaryjoin='Universe.id == universe_collaborators.c.universe_id',
        lazy='dynamic',
        back_populates='collaborators'
    )

    User.accessible_universes = db.relationship(
        Universe,
        secondary=universe_access,
        primaryjoin='User.id == universe_access.c.user_id',
        secondaryjoin='Universe.id == universe_access.c.universe_id',
        lazy='dynamic',
        backref=db.backref('accessible_by', lazy='dynamic')
    )

    Universe.collaborators = db.relationship(
        User,
        secondary=universe_collaborators,
        primaryjoin='Universe.id == universe_collaborators.c.universe_id',
        secondaryjoin='User.id == universe_collaborators.c.user_id',
        lazy='dynamic',
        back_populates='collaborating_universes'
    )

