"""User model module."""
from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from werkzeug.security import generate_password_hash, check_password_hash
from .. import db
from .base_models import BaseModel, TimestampMixin

class User(BaseModel, TimestampMixin):
    """User model for storing user data."""

    __tablename__ = 'users'

    id = Column(Integer, primary_key=True)
    username = Column(String(80), unique=True, nullable=False)
    email = Column(String(120), unique=True, nullable=False)
    password_hash = Column(String(128))
    is_active = Column(Boolean, default=False)

    # Relationships
    profile = relationship('Profile', uselist=False, back_populates='user', cascade='all, delete-orphan')
    universes = relationship('Universe', back_populates='user', cascade='all, delete-orphan')

    def set_password(self, password):
        """Set password hash."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Check password hash."""
        return check_password_hash(self.password_hash, password)

    def activate(self):
        """Activate user account."""
        self.is_active = True

    def deactivate(self):
        """Deactivate user account."""
        self.is_active = False

    def to_dict(self):
        """Convert user to dictionary."""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
