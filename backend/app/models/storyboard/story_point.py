"""Story Point model."""
from sqlalchemy import Column, String, ForeignKey, Text, DateTime, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from backend.app.models.base import Base


class StoryPoint(Base):
    """Story Point model."""

    __tablename__ = "story_points"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(100), nullable=False)
    content = Column(Text, nullable=True)
    position_x = Column(Float, nullable=False)
    position_y = Column(Float, nullable=False)
    storyboard_id = Column(
        UUID(as_uuid=True),
        ForeignKey("storyboards.id", ondelete="CASCADE"),
        nullable=False,
    )
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    storyboard = relationship("Storyboard", back_populates="story_points")

    def __repr__(self):
        """Return string representation of the story point."""
        return f"<StoryPoint {self.title}>"

    def to_dict(self):
        """Convert to dictionary."""
        return {
            "id": str(self.id),
            "title": self.title,
            "content": self.content,
            "position_x": self.position_x,
            "position_y": self.position_y,
            "storyboard_id": str(self.storyboard_id),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
