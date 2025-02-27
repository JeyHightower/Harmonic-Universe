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
    scene_id = Column(UUID(as_uuid=True), ForeignKey("scenes.id", ondelete="CASCADE"))
    parameters = Column(JSONB)  # Constraint-specific parameters

    # Relationships
    scene = relationship("Scene", back_populates="physics_constraints")

    def to_dict(self):
        """Convert to dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "type": self.type,
            "scene_id": self.scene_id,
            "parameters": self.parameters,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }
