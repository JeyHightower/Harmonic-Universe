"""
MIDI event model.
"""

from typing import Dict, Optional, TYPE_CHECKING
from uuid import UUID
from sqlalchemy import String, Integer, Float, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
import enum

from app.db.base_model import Base, GUID

# Handle circular imports
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.models.audio_file import AudioFile

class MidiEventType(str, enum.Enum):
    """MIDI event type enum."""
    NOTE_ON = "NOTE_ON"
    NOTE_OFF = "NOTE_OFF"
    CONTROL_CHANGE = "CONTROL_CHANGE"
    PROGRAM_CHANGE = "PROGRAM_CHANGE"
    PITCH_BEND = "PITCH_BEND"
    AFTERTOUCH = "AFTERTOUCH"
    SYSTEM = "SYSTEM"

class MidiEvent(Base):
    """MIDI event model."""
    __tablename__ = "midi_events"
    __table_args__ = {'extend_existing': True}

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True)
    audio_file_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("audio_files.id", ondelete="CASCADE"), nullable=False)
    event_type: Mapped[MidiEventType] = mapped_column(String, nullable=False)
    timestamp: Mapped[float] = mapped_column(Float, nullable=False)
    channel: Mapped[int] = mapped_column(Integer, nullable=False)
    note: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    velocity: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    control: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    value: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Additional metadata stored as JSON
    event_metadata: Mapped[Dict] = mapped_column(
        JSON,
        server_default='{}',
        nullable=False
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(nullable=False)
    updated_at: Mapped[datetime] = mapped_column(nullable=False)

    # Relationships
    audio_file = relationship("AudioFile", back_populates="midi_events")

    def __repr__(self) -> str:
        """Return string representation."""
        return f"<MidiEvent {self.event_type} at {self.timestamp}>"
