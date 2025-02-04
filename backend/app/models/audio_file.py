"""
Audio file model.
"""

from typing import Dict, List, Optional, TYPE_CHECKING
from uuid import UUID, uuid4
from sqlalchemy import String, Integer, Float, ForeignKey, Enum as SQLAlchemyEnum, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
import enum

from app.db.base_model import Base, GUID

# Handle circular imports
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.models.midi_event import MidiEvent
    from app.models.user import User
    from app.models.universe import Universe
    from app.models.scene import Scene

class AudioFormat(str, enum.Enum):
    """Audio format enum."""
    WAV = "WAV"
    MP3 = "MP3"
    OGG = "OGG"
    MIDI = "MIDI"

class AudioType(str, enum.Enum):
    """Audio type enum."""
    MUSIC = "MUSIC"
    SOUND_EFFECT = "SOUND_EFFECT"
    VOICE = "VOICE"
    AMBIENT = "AMBIENT"
    UPLOADED = "UPLOADED"

class AudioFile(Base):
    """Audio file model."""
    __tablename__ = "audio_files"
    __table_args__ = {'extend_existing': True}

    # Override id from Base to use GUID type
    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    format: Mapped[str] = mapped_column(SQLAlchemyEnum(AudioFormat, name="audio_format_enum", create_constraint=True), nullable=False)
    type: Mapped[str] = mapped_column(SQLAlchemyEnum(AudioType, name="audio_type_enum", create_constraint=True), nullable=False)
    duration: Mapped[float] = mapped_column(Float, nullable=False)
    sample_rate: Mapped[int] = mapped_column(Integer, nullable=False)
    channels: Mapped[int] = mapped_column(Integer, nullable=False)
    bit_depth: Mapped[int] = mapped_column(Integer, nullable=False)
    file_path: Mapped[str] = mapped_column(String, nullable=False)
    creator_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("users.id"), nullable=False)
    universe_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("universes.id"), nullable=False)
    scene_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("scenes.id", ondelete="CASCADE"), nullable=False)

    # Additional metadata stored as JSON
    audio_metadata: Mapped[Dict] = mapped_column(
        JSON,
        server_default='{}',
        nullable=False
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(nullable=False)
    updated_at: Mapped[datetime] = mapped_column(nullable=False)

    # Relationships
    creator = relationship("User", back_populates="audio_files")
    universe = relationship("Universe", back_populates="audio_files")
    scene: Mapped["Scene"] = relationship("Scene", back_populates="audio_files")
    midi_events = relationship("MidiEvent", back_populates="audio_file", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        """Return string representation."""
        return f"<AudioFile {self.name} ({self.format})>"
