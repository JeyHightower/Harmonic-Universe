"""User model."""
from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import BaseModel
from app.core.pwd_context import get_password_hash, verify_password

class User(BaseModel):
    """User model."""

    __tablename__ = "users"

    username = Column(String(255), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean(), default=True)
    is_verified = Column(Boolean(), default=False)
    verification_token = Column(String(255), unique=True)
    verification_token_expires = Column(DateTime)
    reset_token = Column(String(255), unique=True)
    reset_token_expires = Column(DateTime)
    refresh_token = Column(String(255), unique=True)
    refresh_token_expires = Column(DateTime)
    color = Column(String(7))  # Hex color code

    # Relationships
    universes = relationship("Universe", back_populates="user", cascade="all, delete-orphan")
    scenes = relationship("Scene", back_populates="creator", cascade="all, delete-orphan")
    audio_tracks = relationship("AudioTrack", back_populates="user", cascade="all, delete-orphan")

    def set_password(self, password: str) -> None:
        """Set password hash."""
        self.password_hash = get_password_hash(password)

    def verify_password(self, password: str) -> bool:
        """Verify password."""
        return verify_password(password, self.password_hash)

    def to_dict(self):
        """Convert to dictionary."""
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "is_active": self.is_active,
            "is_verified": self.is_verified,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }
