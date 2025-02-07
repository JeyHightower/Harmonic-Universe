"""
MIDI event model.
"""

from sqlalchemy import Column, Integer, Float, String, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class MIDIEvent(Base):
    """MIDI event in a sequence."""
    __tablename__ = "midi_events"

    id = Column(Integer, primary_key=True, index=True)
    sequence_id = Column(Integer, ForeignKey("midi_sequences.id", ondelete="CASCADE"))
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
