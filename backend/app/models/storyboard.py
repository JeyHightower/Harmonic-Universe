"""Storyboard model module."""
from sqlalchemy import Column, Integer, String, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship, Mapped, mapped_column
from typing import List, Optional, Dict, Any
from .. import db
from .base_models import BaseModel, TimestampMixin
from .universe import Universe
from .scene import Scene


class Storyboard(BaseModel, TimestampMixin):
    """Storyboard model for organizing scenes."""

    __tablename__ = 'storyboards'

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True
    )
    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )
    description: Mapped[Optional[str]] = mapped_column(Text)
    sequence: Mapped[Optional[int]] = mapped_column(Integer)
    universe_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey('universes.id'),
        nullable=False
    )

    # Relationships with type hints
    universe: Mapped["Universe"] = relationship(
        "Universe",
        back_populates="storyboards"
    )
    scenes: Mapped[List["Scene"]] = relationship(
        "Scene",
        back_populates="storyboard",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="Scene.sequence"
    )

    def to_dict(self) -> Dict[str, Any]:
        """Convert storyboard to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'universe_id': self.universe_id,
            'created_at': (
                self.created_at.isoformat() if self.created_at else None
            ),
            'updated_at': (
                self.updated_at.isoformat() if self.updated_at else None
            )
        }
