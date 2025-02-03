"""
Scene object model.
"""

from typing import Dict, Optional, TYPE_CHECKING
from uuid import UUID
from sqlalchemy import String, ForeignKey, Enum as SQLAlchemyEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
import enum

from app.db.base_model import Base
from app.db.custom_types import GUID, JSONType

if TYPE_CHECKING:
    from app.models.scene import Scene

class SceneObjectType(str, enum.Enum):
    """Scene object type enum."""
    MESH = "MESH"
    LIGHT = "LIGHT"
    CAMERA = "CAMERA"
    PARTICLE = "PARTICLE"
    SOUND = "SOUND"
    EFFECT = "EFFECT"

class SceneObject(Base):
    """Scene object model."""
    __tablename__ = "scene_objects"
    __table_args__ = {'extend_existing': True}

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True)
    scene_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("scenes.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    type: Mapped[SceneObjectType] = mapped_column(SQLAlchemyEnum(SceneObjectType), nullable=False)

    # Object properties stored as JSON
    properties: Mapped[dict] = mapped_column(
        JSONType(),
        server_default='{}',
        nullable=False
    )

    # Additional metadata stored as JSON
    object_metadata: Mapped[dict] = mapped_column(
        JSONType(),
        server_default='{}',
        nullable=False
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    scene: Mapped["Scene"] = relationship("Scene", back_populates="scene_objects")

    def __repr__(self) -> str:
        """Return string representation of scene object."""
        return f"<SceneObject {self.name} ({self.type})>"
