"""Profile model module."""
from sqlalchemy import Column, Integer, String, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from .. import db
from .base_models import BaseModel, TimestampMixin

class Profile(BaseModel, TimestampMixin):
    """Profile model for storing user profile information."""

    __tablename__ = 'profiles'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), unique=True, nullable=False)
    bio = Column(Text)
    preferences = Column(JSON, default=dict)

    # Relationships
    user = relationship('User', back_populates='profile')

    def to_dict(self):
        """Convert profile to dictionary."""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'bio': self.bio,
            'preferences': self.preferences,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
