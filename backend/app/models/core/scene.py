"""Scene model."""

from typing import TYPE_CHECKING
from sqlalchemy import Column, String, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.core.base import BaseModel

if TYPE_CHECKING:
    from .user import User  # noqa: F401
    from .universe import Universe  # noqa: F401
    from ..physics.physics_parameter import PhysicsParameter  # noqa: F401
    from ..physics.physics_object import PhysicsObject  # noqa: F401
    from ..physics.physics_constraint import PhysicsConstraint  # noqa: F401
    from ..audio.audio_track import AudioTrack  # noqa: F401
    from ..audio.midi_sequence import MIDISequence  # noqa: F401

class Scene(BaseModel):
    """Scene model."""

    __tablename__ = "scenes"

    name = Column(String, nullable=False)
    description = Column(Text)

    # Foreign Keys
    universe_id = Column(UUID(as_uuid=True), ForeignKey("universes.id", ondelete="CASCADE"), nullable=False)
    creator_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Relationships
    universe = relationship("Universe", back_populates="scenes")
    creator = relationship("User", back_populates="scenes")
    physics_objects = relationship("PhysicsObject", back_populates="scene", cascade="all, delete-orphan")
    physics_constraints = relationship("PhysicsConstraint", back_populates="scene", cascade="all, delete-orphan")
    physics_parameters = relationship("PhysicsParameter", back_populates="scene", uselist=False, cascade="all, delete-orphan")
    audio_tracks = relationship("AudioTrack", back_populates="scene", cascade="all, delete-orphan")
    midi_sequences = relationship("MIDISequence", back_populates="scene", cascade="all, delete-orphan")

    # Ensure proper table creation order
    __table_args__ = {'extend_existing': True}

    def __repr__(self) -> str:
        """String representation of Scene."""
        return f"<Scene {self.name}>"

    def to_dict(self):
        """Convert to dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "universe_id": self.universe_id,
            "creator_id": self.creator_id,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }
