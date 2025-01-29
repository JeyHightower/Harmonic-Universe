"""RealtimeState model."""
from datetime import datetime, timezone
from sqlalchemy.orm import relationship
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from ..extensions import db
from typing import Dict, Any, Optional

class RealtimeState(db.Model):
    """RealtimeState model for managing real-time collaboration state."""

    __tablename__ = 'realtime_states'
    __table_args__ = (
        db.Index('idx_realtime_states_universe', 'universe_id'),
        db.Index('idx_realtime_states_user', 'user_id'),
    )

    id = Column(Integer, primary_key=True)
    universe_id = Column(Integer, ForeignKey('universes.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    current_view = Column(String(100))
    cursor_position = Column(JSON)
    last_updated = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    universe = relationship("Universe")
    user = relationship("User")

    def __init__(
        self,
        universe_id: int,
        user_id: int,
        current_view: Optional[str] = None,
        cursor_position: Optional[Dict[str, Any]] = None
    ):
        """Initialize realtime state."""
        self.universe_id = universe_id
        self.user_id = user_id
        self.current_view = current_view
        self.cursor_position = cursor_position or {}

    def to_dict(self) -> Dict[str, Any]:
        """Convert realtime state to dictionary."""
        return {
            'id': self.id,
            'universe_id': self.universe_id,
            'user_id': self.user_id,
            'current_view': self.current_view,
            'cursor_position': self.cursor_position,
            'last_updated': self.last_updated.isoformat(),
            'user': {
                'id': self.user.id,
                'username': self.user.username
            } if self.user else None
        }

    def update_state(
        self,
        current_view: Optional[str] = None,
        cursor_position: Optional[Dict[str, Any]] = None
    ) -> None:
        """Update realtime state."""
        if current_view is not None:
            self.current_view = current_view
        if cursor_position is not None:
            self.cursor_position = cursor_position
        self.last_updated = datetime.now(timezone.utc)

    @classmethod
    def get_universe_states(cls, universe_id: int) -> list:
        """Get all realtime states for a universe."""
        return cls.query.filter_by(universe_id=universe_id).all()

    @classmethod
    def get_user_state(cls, universe_id: int, user_id: int) -> Optional['RealtimeState']:
        """Get realtime state for a specific user in a universe."""
        return cls.query.filter_by(
            universe_id=universe_id,
            user_id=user_id
        ).first()

    def __repr__(self):
        """String representation."""
        return f'<RealtimeState(universe_id={self.universe_id}, user_id={self.user_id})>'
