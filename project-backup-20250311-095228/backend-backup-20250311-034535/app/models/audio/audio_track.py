"""Audio track model."""
from sqlalchemy import Column, String, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from ..base import BaseModel


class AudioTrack(BaseModel):
    """Audio track model."""

    __tablename__ = "audio_tracks"

    name = Column(String(255), nullable=False)
    universe_id = Column(
        UUID(as_uuid=True), ForeignKey("universes.id", ondelete="CASCADE")
    )
    scene_id = Column(UUID(as_uuid=True), ForeignKey("scenes.id", ondelete="CASCADE"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    file_path = Column(String(1000))
    duration = Column(Float)
    parameters = Column(JSONB)

    # Relationships
    universe = relationship("Universe", back_populates="audio_tracks")
    scene = relationship("Scene", back_populates="audio_tracks")
    user = relationship(
        "User", back_populates="audio_tracks"
    )  # Changed from audio_files to audio_tracks

    def to_dict(self):
        """Convert to dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "universe_id": self.universe_id,
            "scene_id": self.scene_id,
            "user_id": self.user_id,
            "file_path": self.file_path,
            "duration": self.duration,
            "parameters": self.parameters,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
