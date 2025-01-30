"""Universe model module."""
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.ext.mutable import MutableDict
from .. import db
from .base_models import BaseModel, TimestampMixin
from typing import Optional
from .association_tables import universe_collaborators

class Universe(BaseModel, TimestampMixin):
    """Universe model for storing universe data."""

    __tablename__ = 'universes'

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(String(1000))
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    is_public = Column(Boolean, default=True)
    max_participants = Column(Integer, default=10)
    collaborators_count = Column(Integer, default=0)
    music_parameters = Column(MutableDict.as_mutable(JSON), default=dict)
    visual_parameters = Column(MutableDict.as_mutable(JSON), default=dict)

    # Relationships
    user = relationship('User', back_populates='universes')
    collaborators = relationship(
        'User',
        secondary=universe_collaborators,
        lazy='joined',
        backref=db.backref('collaborated_universes', lazy=True)
    )
    storyboards = relationship(
        'Storyboard',
        back_populates='universe',
        cascade='all, delete-orphan',
        lazy='dynamic'
    )

    def can_user_edit(self, user_id: int) -> bool:
        """Check if a user can edit this universe."""
        if not user_id:
            return False
        return user_id == self.user_id or any(c.id == user_id for c in self.collaborators)

    def can_user_access(self, user_id: Optional[int]) -> bool:
        """Check if a user can access this universe."""
        if self.is_public:
            return True
        if not user_id:
            return False
        return user_id == self.user_id or any(c.id == user_id for c in self.collaborators)

    def to_dict(self):
        """Convert universe to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'user_id': self.user_id,
            'is_public': self.is_public,
            'max_participants': self.max_participants,
            'collaborators_count': self.collaborators_count,
            'music_parameters': self.music_parameters,
            'visual_parameters': self.visual_parameters,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

