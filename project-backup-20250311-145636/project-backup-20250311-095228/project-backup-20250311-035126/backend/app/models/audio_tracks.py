from uuid import uuid4
from sqlalchemy import Column, String, Boolean, ForeignKey, DateTime, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from database import Base

class AudioTrack(Base):
    __tablename__ = "audio_tracks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    parameters = Column(JSONB)
    is_active = Column(Boolean, default=True)
    universe_id = Column(UUID(as_uuid=True), ForeignKey("universes.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    universe = relationship("Universe", back_populates="audio_tracks")
