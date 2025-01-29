"""Universe model."""
from datetime import datetime, timezone
from sqlalchemy.orm import relationship
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, event, JSON
from sqlalchemy.sql import or_
from ..extensions import db
from typing import Dict, Any, List, Optional
from .association_tables import universe_collaborators, universe_access

class Universe(db.Model):
    """Universe model for storing universe related details."""

    __tablename__ = "universes"
    __table_args__ = (
        db.Index("idx_user_id", "user_id"),
        db.Index("idx_is_public", "is_public"),
        db.Index("idx_created_at", "created_at"),
        db.Index("idx_name", "name"),
        db.Index("idx_collaborators_count", "collaborators_count"),
    )

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(String(500))
    is_public = Column(Boolean, default=False)
    allow_guests = Column(Boolean, default=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    collaborators_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    music_parameters = Column(JSON, default=dict)
    visual_parameters = Column(JSON, default=dict)

    # Relationships are set up in relationships.py

    def __init__(
        self,
        name,
        description=None,
        is_public=False,
        allow_guests=False,
        user_id=None,
        music_parameters=None,
        visual_parameters=None
    ):
        """Initialize universe."""
        self.name = name
        self.description = description
        self.is_public = is_public
        self.allow_guests = allow_guests
        self.user_id = user_id
        self.music_parameters = music_parameters or {}
        self.visual_parameters = visual_parameters or {}

    def to_dict(self):
        """Convert universe to dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "is_public": self.is_public,
            "allow_guests": self.allow_guests,
            "user_id": self.user_id,
            "collaborators_count": self.collaborators_count,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "music_parameters": self.music_parameters,
            "visual_parameters": self.visual_parameters
        }

    def can_user_access(self, user_id):
        """Check if user can access the universe."""
        if self.is_public:
            return True
        if not user_id:
            return False
        if self.user_id == user_id:
            return True
        return bool(self.collaborators.filter_by(id=user_id).first())

    def can_user_edit(self, user_id):
        """Check if user can edit the universe."""
        if not user_id:
            return False
        return self.user_id == user_id

    def can_manage_collaborators(self, user_id):
        """Check if user can manage collaborators."""
        if not user_id:
            return False
        return self.user_id == user_id

    @classmethod
    def get_accessible_universes(cls, user_id):
        """Get all universes accessible by user."""
        query = cls.query
        if user_id:
            query = query.filter(
                or_(
                    cls.is_public == True,
                    cls.user_id == user_id,
                    cls.collaborators.any(id=user_id)
                )
            )
        else:
            query = query.filter(cls.is_public == True)
        return query.all()

    def __repr__(self):
        """String representation."""
        return f"<Universe(id={self.id}, name='{self.name}')>"
