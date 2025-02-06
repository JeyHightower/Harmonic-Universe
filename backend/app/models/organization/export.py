"""Export model."""

from typing import Dict, Any, Optional
from sqlalchemy import String, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from uuid import UUID

from app.db.base_class import Base
from app.models.base import TimestampMixin, UUIDMixin

class Export(Base, TimestampMixin, UUIDMixin):
    """Export model."""
    __tablename__ = "exports"

    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    creator_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    scene_id: Mapped[UUID] = mapped_column(ForeignKey("scenes.id"), nullable=False)
    settings: Mapped[Dict] = mapped_column(JSON, nullable=False, default=dict)

    # Relationships
    creator = relationship("User", back_populates="exports")
    scene = relationship("Scene", back_populates="exports")

    def __repr__(self) -> str:
        """String representation."""
        return f"<Export {self.name}>"
