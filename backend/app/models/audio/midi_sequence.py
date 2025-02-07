"""
MIDI sequence model.
"""

from sqlalchemy import Column, Integer, String, Float, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class MIDISequence(Base):
    """MIDI sequence containing multiple events."""
    __tablename__ = "midi_sequences"

    id = Column(Integer, primary_key=True, index=True)
    scene_id = Column(Integer, ForeignKey("scenes.id", ondelete="CASCADE"))
    name = Column(String, index=True)
    tempo = Column(Float, default=120.0)
    time_signature = Column(String, default="4/4")
    is_loop = Column(Boolean, default=False)
    loop_start = Column(Float, default=0.0)
    loop_end = Column(Float, nullable=True)
    quantization = Column(Float, default=0.0)  # 0 means no quantization
    parameters = Column(JSON, default=dict)  # Additional parameters

    # Relationships
    scene = relationship("Scene", back_populates="midi_sequences")
    events = relationship("MIDIEvent", back_populates="sequence", cascade="all, delete-orphan")
    audio_tracks = relationship("AudioTrack", back_populates="midi_sequence", cascade="all, delete-orphan")

    def __repr__(self):
        """String representation."""
        return f"<MIDISequence(id={self.id}, name='{self.name}', tempo={self.tempo})>"

    def get_duration(self):
        """Calculate total duration of sequence."""
        if not self.events:
            return 0.0
        return max(event.timestamp + (event.duration or 0.0) for event in self.events)

    def get_events_in_range(self, start_time: float, end_time: float):
        """Get all events within a time range."""
        return [
            event for event in self.events
            if start_time <= event.timestamp <= end_time
            or (event.duration and start_time <= event.timestamp + event.duration <= end_time)
        ]
