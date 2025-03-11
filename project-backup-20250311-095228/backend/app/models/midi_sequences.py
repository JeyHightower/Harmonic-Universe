from uuid import uuid4
from sqlalchemy import Column, String, Float, Integer, ForeignKey, DateTime, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from database import Base

class MidiSequence(Base):
    __tablename__ = "midi_sequences"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String, nullable=False)
    data = Column(JSONB, nullable=False)
    duration = Column(Float)
    tempo = Column(Integer)
    universe_id = Column(UUID(as_uuid=True), ForeignKey("universes.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    universe = relationship("Universe", back_populates="midi_sequences")
