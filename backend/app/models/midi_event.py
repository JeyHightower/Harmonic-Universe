from typing import Dict, Optional
from uuid import UUID
from sqlalchemy import String, Integer, Float, ForeignKey, Enum, JSON
from sqlalchemy.dialects.postgresql import JSONB
from app.db.custom_types import GUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from sqlalchemy.sql.sqltypes import TIMESTAMP
from datetime import datetime
import enum

from app.db.base_class import Base

# Handle circular imports
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.models.audio_file import AudioFile

class MIDIEventType(str, enum.Enum):
    NOTE_ON = "note_on"
    NOTE_OFF = "note_off"
    CONTROL_CHANGE = "control_change"
    PROGRAM_CHANGE = "program_change"
    PITCH_BEND = "pitch_bend"
    AFTERTOUCH = "aftertouch"
    SYSTEM = "system"

class MIDIEvent(Base):
    __tablename__ = "midi_event"
    __table_args__ = {'extend_existing': True}

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, index=True)
    audio_file_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("audio_file.id", ondelete="CASCADE"))
    event_type: Mapped[MIDIEventType] = mapped_column(Enum(MIDIEventType), nullable=False)
    timestamp: Mapped[float] = mapped_column(Float, nullable=False)  # Time in seconds
    channel: Mapped[int] = mapped_column(Integer, nullable=False)  # MIDI channel (0-15)
    note: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # MIDI note number (0-127)
    velocity: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # Note velocity/intensity (0-127)
    control: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # Control number for CC events
    value: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # Value for CC/program events
    event_metadata: Mapped[dict] = mapped_column(
        JSONB().with_variant(JSON(), 'sqlite'),
        server_default='{}'
    )  # Additional event properties
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())

    # Relationships
    audio_file: Mapped["AudioFile"] = relationship("AudioFile", back_populates="midi_events")

    def __repr__(self) -> str:
        return f"<MIDIEvent {self.event_type} @ {self.timestamp}s>"
