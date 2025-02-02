"""
Visualization models.
"""

from typing import Dict, List, Optional, TYPE_CHECKING
from uuid import UUID
from sqlalchemy import String, Integer, Float, JSON, ForeignKey, Enum, Boolean, Column
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from sqlalchemy.sql.sqltypes import TIMESTAMP
from datetime import datetime
from sqlalchemy.dialects.postgresql import JSONB

from app.db.base_class import Base
from app.db.custom_types import GUID

if TYPE_CHECKING:
    from app.models.scene import Scene

# Re-export models for backward compatibility
__all__ = [
    'Scene',
    'SceneObject',
    'Timeline',
    'Animation',
    'Export',
    'RenderingMode',
    'SceneObjectType',
    'Keyframe',
    'ParameterType'
]

class Visualization(Base):
    """Visualization model."""
    __tablename__ = "visualizations"

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    # Scene relationship
    scene_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("scene.id", ondelete="CASCADE"), nullable=False)
    scene: Mapped["Scene"] = relationship("Scene", back_populates="visualizations")

    # Visualization settings
    settings: Mapped[dict] = mapped_column(
        JSONB().with_variant(JSON(), 'sqlite'),
        server_default='{}',
        nullable=False
    )

    # Visualization data
    data: Mapped[dict] = mapped_column(
        JSONB().with_variant(JSON(), 'sqlite'),
        server_default='{}',
        nullable=False
    )

    # Additional metadata
    visualization_metadata: Mapped[dict] = mapped_column(
        JSONB().with_variant(JSON(), 'sqlite'),
        server_default='{}',
        nullable=False
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self) -> str:
        """Return string representation."""
        return f"<Visualization {self.name}>"
