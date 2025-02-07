"""
Audio track model.
"""

from sqlalchemy import Column, Integer, String, Float, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class AudioTrack(Base):
    """Audio track in a scene."""
    __tablename__ = "audio_tracks"

    id = Column(Integer, primary_key=True, index=True)
    scene_id = Column(Integer, ForeignKey("scenes.id", ondelete="CASCADE"))
    midi_sequence_id = Column(Integer, ForeignKey("midi_sequences.id", ondelete="SET NULL"), nullable=True)
    name = Column(String, index=True)
    file_path = Column(String)
    file_type = Column(String)  # wav, mp3, etc.
    duration = Column(Float)
    sample_rate = Column(Integer)
    channels = Column(Integer)
    is_muted = Column(Boolean, default=False)
    volume = Column(Float, default=1.0)
    pan = Column(Float, default=0.0)  # -1 (left) to 1 (right)
    start_time = Column(Float, default=0.0)
    end_time = Column(Float, nullable=True)
    loop_enabled = Column(Boolean, default=False)
    effects = Column(JSON, default=list)  # List of audio effects
    parameters = Column(JSON, default=dict)  # Additional parameters

    # Relationships
    scene = relationship("Scene", back_populates="audio_tracks")
    midi_sequence = relationship("MIDISequence", back_populates="audio_tracks")
    markers = relationship("AudioMarker", back_populates="track", cascade="all, delete-orphan")
    automation = relationship("AudioAutomation", back_populates="track", cascade="all, delete-orphan")

    def __repr__(self):
        """String representation."""
        return f"<AudioTrack(id={self.id}, name='{self.name}', type='{self.file_type}')>"

    def get_duration(self):
        """Get effective duration considering start and end times."""
        if self.end_time is not None:
            return self.end_time - self.start_time
        return self.duration - self.start_time

    def get_normalized_time(self, time: float) -> float:
        """Convert global time to track-local time."""
        local_time = time - self.start_time
        if self.loop_enabled and self.duration > 0:
            return local_time % self.duration
        return local_time
