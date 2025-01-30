"""Collaborator model."""
from datetime import datetime, timezone
from sqlalchemy.orm import relationship
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, event
from ..extensions import db
from typing import Dict, Any

class Collaborator(db.Model):
    """Collaborator model for managing universe collaborations."""

    __tablename__ = 'collaborators'
    __table_args__ = (
        db.UniqueConstraint('universe_id', 'user_id', name='uq_collaborator'),
        db.Index('idx_collaborators_universe_id', 'universe_id'),
        db.Index('idx_collaborators_user_id', 'user_id'),
        db.Index('idx_collaborators_role', 'role'),
    )

    # Role constants
    ROLE_VIEWER = 'viewer'
    ROLE_EDITOR = 'editor'
    ROLE_ADMIN = 'admin'

    VALID_ROLES = [ROLE_VIEWER, ROLE_EDITOR, ROLE_ADMIN]

    id = Column(Integer, primary_key=True)
    universe_id = Column(Integer, ForeignKey('universes.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    role = Column(String(50), nullable=False, default=ROLE_VIEWER)
    joined_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_active_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    universe = relationship("Universe", backref=db.backref("direct_collaborators", lazy="dynamic"))
    user = relationship("User", backref=db.backref("collaborations", lazy="dynamic"))

    def __init__(
        self,
        universe_id: int,
        user_id: int,
        role: str = ROLE_VIEWER
    ):
        """Initialize collaborator."""
        self.universe_id = universe_id
        self.user_id = user_id
        self.role = role

    def to_dict(self) -> Dict[str, Any]:
        """Convert collaborator to dictionary."""
        return {
            'id': self.id,
            'universe_id': self.universe_id,
            'user_id': self.user_id,
            'role': self.role,
            'joined_at': self.joined_at.isoformat(),
            'last_active_at': self.last_active_at.isoformat(),
            'user': {
                'id': self.user.id,
                'username': self.user.username,
                'email': self.user.email
            } if self.user else None
        }

    def can_edit(self) -> bool:
        """Check if collaborator can edit the universe."""
        return self.role in [self.ROLE_EDITOR, self.ROLE_ADMIN]

    def can_manage_collaborators(self) -> bool:
        """Check if collaborator can manage other collaborators."""
        return self.role == self.ROLE_ADMIN

    def update_last_active(self) -> None:
        """Update last active timestamp."""
        self.last_active_at = datetime.now(timezone.utc)

    def __repr__(self):
        """String representation."""
        return f'<Collaborator(universe_id={self.universe_id}, user_id={self.user_id}, role={self.role})>'

@event.listens_for(Collaborator, 'before_insert')
@event.listens_for(Collaborator, 'before_update')
def validate_collaborator(mapper, connection, target):
    """Validate collaborator before save."""
    if target.role not in target.VALID_ROLES:
        raise ValueError(f"Invalid role. Must be one of: {', '.join(target.VALID_ROLES)}")

@event.listens_for(Collaborator, 'after_insert')
def increment_collaborators_count(mapper, connection, target):
    """Increment universe collaborators count."""
    connection.execute(
        db.text('UPDATE universes SET collaborators_count = collaborators_count + 1 WHERE id = :universe_id'),
        {'universe_id': target.universe_id}
    )

@event.listens_for(Collaborator, 'after_delete')
def decrement_collaborators_count(mapper, connection, target):
    """Decrement universe collaborators count."""
    connection.execute(
        db.text('UPDATE universes SET collaborators_count = collaborators_count - 1 WHERE id = :universe_id'),
        {'universe_id': target.universe_id}
    )
