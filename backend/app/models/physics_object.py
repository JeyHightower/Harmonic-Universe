"""
Physics object model.
"""

from typing import Dict, Optional
from uuid import UUID
from sqlalchemy import String, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime

from app.db.base_model import Base
from app.db.custom_types import GUID, JSONType

# Handle circular imports
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.models.scene import Scene

class PhysicsObject(Base):
    """Physics object model."""
    __tablename__ = "physics_objects"
    __table_args__ = {'extend_existing': True}

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    properties: Mapped[dict] = mapped_column(
        JSONType(),
        server_default='{}',
        nullable=False
    )
    scene_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("scenes.id", ondelete="CASCADE"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    scene: Mapped["Scene"] = relationship("Scene", back_populates="physics_objects")

    def __repr__(self) -> str:
        """Return string representation."""
        return f"<PhysicsObject {self.name}>"
