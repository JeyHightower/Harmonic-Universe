"""
Universe model.
"""

from typing import Dict, Optional, TYPE_CHECKING, List
from uuid import UUID, uuid4
from sqlalchemy import String, ForeignKey, JSON, Boolean, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_model import Base, GUID

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.scene import Scene
    from app.models.audio_file import AudioFile
    from app.models.ai_generation import AIGeneration
    from app.models.storyboard import Storyboard
    from app.models.music_parameter import MusicParameter
    from app.models.physics_parameter import PhysicsParameter

class Universe(Base):
    """Universe model."""
    __tablename__ = "universes"
    __table_args__ = {'extend_existing': True}

    # Primary fields
    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    creator_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("users.id"), nullable=False)
    creator: Mapped["User"] = relationship("User", back_populates="universes", lazy="selectin")
    scenes: Mapped[List["Scene"]] = relationship("Scene", back_populates="universe", lazy="joined", cascade="all, delete-orphan")
    audio_files: Mapped[List["AudioFile"]] = relationship("AudioFile", back_populates="universe", lazy="selectin", cascade="all, delete-orphan")
    ai_generations: Mapped[List["AIGeneration"]] = relationship("AIGeneration", back_populates="universe", lazy="selectin", cascade="all, delete-orphan")
    storyboards: Mapped[List["Storyboard"]] = relationship("Storyboard", back_populates="universe", lazy="selectin", cascade="all, delete-orphan")
    music_parameters_rel: Mapped[List["MusicParameter"]] = relationship("MusicParameter", back_populates="universe", lazy="selectin", cascade="all, delete-orphan")
    physics_parameters: Mapped[List["PhysicsParameter"]] = relationship("PhysicsParameter", back_populates="universe", lazy="selectin", cascade="all, delete-orphan")

    # JSON fields
    physics_json: Mapped[Dict] = mapped_column(
        JSON,
        server_default='{}',
        nullable=False
    )
    music_parameters: Mapped[Dict] = mapped_column(
        JSON,
        server_default='{}',
        nullable=False
    )

    # Collaboration fields
    is_public: Mapped[bool] = mapped_column(Boolean(), default=True, nullable=False)
    max_participants: Mapped[int] = mapped_column(Integer(), default=10, nullable=False)
    collaborators_count: Mapped[int] = mapped_column(Integer(), default=0, nullable=False)

    def __repr__(self) -> str:
        """Return string representation."""
        return f"<Universe {self.name}>"
