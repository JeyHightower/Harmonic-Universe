"""
Visualization models.
"""

from typing import Dict, List, Optional, TYPE_CHECKING
from uuid import UUID
from sqlalchemy import String, Integer, Float, ForeignKey, Enum, Boolean, Column, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from sqlalchemy.sql.sqltypes import TIMESTAMP
from datetime import datetime

from app.db.base_model import Base, GUID

if TYPE_CHECKING:
    from app.models.scene import Scene

class Visualization(Base):
    """Visualization model."""
    __tablename__ = "visualizations"
    __table_args__ = {'extend_existing': True}

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    # Scene relationship
    scene_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("scenes.id", ondelete="CASCADE"), nullable=False)
    scene: Mapped["Scene"] = relationship("Scene", back_populates="visualizations")

    # Visualization settings
    settings: Mapped[Dict] = mapped_column(
        JSON,
        server_default='{}',
        nullable=False
    )

    # Visualization data
    data: Mapped[Dict] = mapped_column(
        JSON,
        server_default='{}',
        nullable=False
    )

    # Additional metadata
    visualization_metadata: Mapped[Dict] = mapped_column(
        JSON,
        server_default='{}',
        nullable=False
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self) -> str:
        """Return string representation."""
        return f"<Visualization {self.name}>"
