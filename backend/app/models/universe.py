"""
Universe model.
"""

from datetime import datetime
from typing import List, Optional, Dict
from uuid import UUID, uuid4
from sqlalchemy import String, Text, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.custom_types import GUID
from app.db.base_model import Base

class Universe(Base):
    """Universe model."""
    __tablename__ = "universes"
    __table_args__ = {'extend_existing': True}

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    physics_json: Mapped[Dict] = mapped_column(
        'physics_parameters',  # Rename column but keep table name same
        JSONB().with_variant(JSON(), 'sqlite'),
        server_default='{}'
    )
    music_parameters: Mapped[Dict] = mapped_column(
        JSONB().with_variant(JSON(), 'sqlite'),
        server_default='{}'
    )
    creator_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    creator: Mapped["User"] = relationship("User", back_populates="universes")
    scenes: Mapped[List["Scene"]] = relationship("Scene", back_populates="universe", cascade="all, delete-orphan")
    physics_parameters: Mapped[List["PhysicsParameter"]] = relationship(
        "PhysicsParameter",
        back_populates="universe",
        cascade="all, delete-orphan"
    )
    music_parameters_rel: Mapped[List["MusicParameter"]] = relationship(
        "MusicParameter",
        back_populates="universe",
        cascade="all, delete-orphan"
    )
    audio_files: Mapped[List["AudioFile"]] = relationship(
        "AudioFile",
        back_populates="universe",
        cascade="all, delete-orphan"
    )
    storyboards: Mapped[List["Storyboard"]] = relationship(
        "Storyboard",
        back_populates="universe",
        cascade="all, delete-orphan"
    )
    ai_generations: Mapped[List["AIGeneration"]] = relationship(
        "AIGeneration",
        back_populates="universe",
        cascade="all, delete-orphan"
    )

    # Reintroduce collaboration features
    is_public: Mapped[bool] = mapped_column(default=True)
    max_participants: Mapped[int] = mapped_column(default=10)
    collaborators_count: Mapped[int] = mapped_column(default=0)

    def __repr__(self) -> str:
        """Return string representation of universe."""
        return f"<Universe {self.name}>"
