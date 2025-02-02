"""
Audio file model.
"""

from typing import Dict, List, Optional
from uuid import UUID
from sqlalchemy import String, Integer, Float, ForeignKey, Enum, JSON
from sqlalchemy.dialects.postgresql import JSONB
from app.db.custom_types import GUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum
from datetime import datetime

from app.db.base_class import Base

# Handle circular imports
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.models.universe import Universe
    from app.models.ai_generation import AIGeneration
    from app.models.midi_event import MIDIEvent
    from app.models.user import User

class AudioFormat(str, enum.Enum):
    """Audio format enum."""
    WAV = "wav"
    MP3 = "mp3"
    MIDI = "midi"
    OGG = "ogg"
    FLAC = "flac"
    AAC = "aac"
    M4A = "m4a"

class AudioType(str, enum.Enum):
    """Audio type enum."""
    MUSIC = "music"
    SOUND_EFFECT = "sound_effect"
    VOICE = "voice"
    AMBIENT = "ambient"
    GENERATED = "generated"
    UPLOADED = "uploaded"
    PROCESSED = "processed"
    RENDERED = "rendered"
    OTHER = "other"

class AudioFile(Base):
    """Audio file model."""
    __tablename__ = "audio_file"
    __table_args__ = {'extend_existing': True}

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String)
    format: Mapped[AudioFormat] = mapped_column(Enum(AudioFormat), nullable=False)
    type: Mapped[AudioType] = mapped_column(Enum(AudioType), nullable=False)
    duration: Mapped[Optional[float]] = mapped_column(Float)  # Duration in seconds
    sample_rate: Mapped[Optional[int]] = mapped_column(Integer)  # Sample rate in Hz
    channels: Mapped[Optional[int]] = mapped_column(Integer)  # Number of audio channels
    bit_depth: Mapped[Optional[int]] = mapped_column(Integer)  # Bit depth
    file_path: Mapped[str] = mapped_column(String, nullable=False)  # Path to audio file
    file_size: Mapped[int] = mapped_column(Integer)  # File size in bytes
    waveform_data: Mapped[Optional[dict]] = mapped_column(
        JSONB().with_variant(JSON(), 'sqlite'),
        nullable=True
    )  # Pre-computed waveform data for visualization
    audio_metadata: Mapped[dict] = mapped_column(
        JSONB().with_variant(JSON(), 'sqlite'),
        server_default='{}'
    )  # Additional audio properties
    universe_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("universes.id", ondelete="CASCADE"))
    creator_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("users.id"), nullable=False)
    generation_id: Mapped[Optional[UUID]] = mapped_column(GUID(), ForeignKey("ai_generations.id", ondelete="SET NULL"))
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    universe: Mapped["Universe"] = relationship("Universe", back_populates="audio_files")
    creator: Mapped["User"] = relationship("User", back_populates="audio_files")
    generation: Mapped[Optional["AIGeneration"]] = relationship("AIGeneration", back_populates="audio_files")
    midi_events: Mapped[List["MIDIEvent"]] = relationship("MIDIEvent", back_populates="audio_file", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        """Return string representation of audio file."""
        return f"<AudioFile {self.name} ({self.format})>"
