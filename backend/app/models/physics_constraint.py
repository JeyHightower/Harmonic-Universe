from typing import Dict, Optional
from uuid import UUID
from sqlalchemy import String, Float, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import JSONB
from app.db.custom_types import GUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime

from app.db.base_class import Base

class PhysicsConstraint(Base):
    __tablename__ = "physics_constraints"

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    parameters: Mapped[dict] = mapped_column(
        JSONB().with_variant(JSON(), 'sqlite'),
        server_default='{}'
    )
    scene_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("scene.id", ondelete="CASCADE"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    scene: Mapped["Scene"] = relationship("Scene", back_populates="physics_constraints")

    def __repr__(self) -> str:
        return f"<PhysicsConstraint {self.name}>"
