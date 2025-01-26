"""Profile model."""
from datetime import datetime, timezone
from ..extensions import db
from sqlalchemy.orm import relationship
from typing import Dict, Any
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON


class Profile(db.Model):
    """Profile model for storing user profile details."""

    __tablename__ = "profiles"
    __table_args__ = (
        db.Index("idx_user_id", "user_id"),
        db.Index("idx_created_at", "created_at"),
    )

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    bio = Column(Text)
    location = Column(String(100))
    website = Column(String(200))
    avatar_url = Column(String(200))
    social_links = Column(JSON)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    user = relationship("User", back_populates="profile")

    def __init__(
        self,
        user_id: int,
        bio: str = None,
        location: str = None,
        website: str = None,
        avatar_url: str = None,
        social_links: Dict = None,
    ):
        """Initialize profile."""
        self.user_id = user_id
        self.bio = bio
        self.location = location
        self.website = website
        self.avatar_url = avatar_url
        self.social_links = social_links or {}

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "bio": self.bio,
            "location": self.location,
            "website": self.website,
            "avatar_url": self.avatar_url,
            "social_links": self.social_links,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "user": self.user.to_dict() if self.user else None,
        }

    def __repr__(self):
        """String representation."""
        return f"<Profile {self.id}>"

    def update(self, data):
        for key, value in data.items():
            if hasattr(self, key):
                setattr(self, key, value)
        self.updated_at = datetime.now(timezone.utc)
        return self
