"""
Timeline model for managing animation sequences.
"""

from typing import List, Optional
from uuid import UUID, uuid4
from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_model import Base, GUID

class Timeline(Base):
    """Timeline model for managing sequences of keyframes."""
    __tablename__ = "timelines"
    __table_args__ = {'extend_existing': True}

    # Primary fields
    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    scene_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("scenes.id"), nullable=False)

    # Relationships
    scene = relationship("Scene", back_populates="timelines")
    keyframes: Mapped[List["Keyframe"]] = relationship(
        "Keyframe",
        back_populates="timeline",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        """String representation."""
        return f"<Timeline {self.name}>"
