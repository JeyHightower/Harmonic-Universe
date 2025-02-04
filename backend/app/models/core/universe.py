"""
Universe model.
"""

from typing import Dict, Optional, TYPE_CHECKING, List
from uuid import UUID, uuid4
from sqlalchemy import String, ForeignKey, JSON, Boolean, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from app.db.base_model import Base, GUID
from app.models.organization.storyboard import Storyboard

if TYPE_CHECKING:
    from app.models.core.user import User
    from app.models.core.scene import Scene
    from app.models.audio.audio_file import AudioFile
    from app.models.audio.music_parameter import MusicParameter
    from app.models.physics.physics_parameter import PhysicsParameter
    from app.models.ai.ai_generation import AIGeneration

class Universe(Base):
    """Universe model."""
    __tablename__ = "universes"
    __table_args__ = {'extend_existing': True}

    # Primary fields
    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    creator_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("users.id"), nullable=False)

    # Settings
    physics_parameters: Mapped[Dict] = mapped_column(
        JSON,
        server_default='{}',
        nullable=False
    )
    music_parameters: Mapped[Dict] = mapped_column(
        JSON,
        server_default='{}',
        nullable=False
    )

    # Collaboration settings
    is_public: Mapped[bool] = mapped_column(Boolean(), default=True, nullable=False)
    max_participants: Mapped[int] = mapped_column(Integer(), default=10, nullable=False)
    collaborators_count: Mapped[int] = mapped_column(Integer(), default=0, nullable=False)

    # Relationships
    creator = relationship("User", back_populates="universes")
    scenes = relationship("Scene", back_populates="universe", cascade="all, delete-orphan")
    storyboards = relationship("Storyboard", back_populates="universe", cascade="all, delete-orphan")
    audio_files: Mapped[List["AudioFile"]] = relationship(
        "AudioFile",
        back_populates="universe",
        cascade="all, delete-orphan"
    )
    music_parameters_rel: Mapped[List["MusicParameter"]] = relationship(
        "MusicParameter",
        back_populates="universe",
        cascade="all, delete-orphan"
    )
    physics_parameters_rel: Mapped[List["PhysicsParameter"]] = relationship(
        "PhysicsParameter",
        back_populates="universe",
        cascade="all, delete-orphan"
    )
    ai_generations: Mapped[List["AIGeneration"]] = relationship(
        "AIGeneration",
        back_populates="universe",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        """String representation."""
        return f"<Universe {self.name}>"
