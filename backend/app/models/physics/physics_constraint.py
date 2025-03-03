"""Physics constraint model."""
from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from ..base import BaseModel

class PhysicsConstraint(BaseModel):
    """Physics constraint model."""

    __tablename__ = "physics_constraints"

    name = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False)  # e.g., "distance", "angle", "spring"
    scene_id = Column(UUID(as_uuid=True), ForeignKey("scenes.id", ondelete="CASCADE"), nullable=False)
    object1_id = Column(UUID(as_uuid=True), ForeignKey("physics_objects.id", ondelete="CASCADE"), nullable=False)
    object2_id = Column(UUID(as_uuid=True), ForeignKey("physics_objects.id", ondelete="CASCADE"), nullable=False)
    parameters = Column(JSONB, nullable=False, default=lambda: {})

    # Relationships
    scene = relationship("Scene", back_populates="physics_constraints")
    object1 = relationship("PhysicsObject", foreign_keys=[object1_id])
    object2 = relationship("PhysicsObject", foreign_keys=[object2_id])

    def to_dict(self):
        """Convert to dictionary."""
        return {
            "id": str(self.id),
            "name": self.name,
            "type": self.type,
            "scene_id": str(self.scene_id),
            "object1_id": str(self.object1_id),
            "object2_id": str(self.object2_id),
            "parameters": self.parameters,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }
