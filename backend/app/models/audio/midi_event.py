"""
MIDI event model.
"""

from sqlalchemy import Column, Integer, Float, String, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from ..base import BaseModel

class MIDIEvent(BaseModel):
    """MIDI event in a sequence."""
    __tablename__ = "midi_events"

    sequence_id = Column(UUID(as_uuid=True), ForeignKey("midi_sequences.id", ondelete="CASCADE"))
    event_type = Column(String, index=True)  # note_on, note_off, control_change, etc.
    channel = Column(Integer)
    note = Column(Integer, nullable=True)  # For note events
    velocity = Column(Integer, nullable=True)  # For note events
    control_number = Column(Integer, nullable=True)  # For control change events
    control_value = Column(Integer, nullable=True)  # For control change events
    timestamp = Column(Float)  # Time in seconds from sequence start
    duration = Column(Float, nullable=True)  # For note events
    parameters = Column(JSON, default=dict)  # Additional parameters

    # Relationships
    sequence = relationship("MIDISequence", back_populates="events")

    def __repr__(self):
        """String representation."""
        return f"<MIDIEvent(id={self.id}, type='{self.event_type}', time={self.timestamp})>"

    def to_dict(self):
        """Convert to dictionary."""
        return {
            "id": self.id,
            "sequence_id": self.sequence_id,
            "event_type": self.event_type,
            "channel": self.channel,
            "note": self.note,
            "velocity": self.velocity,
            "control_number": self.control_number,
            "control_value": self.control_value,
            "timestamp": self.timestamp,
            "duration": self.duration,
            "parameters": self.parameters,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }
