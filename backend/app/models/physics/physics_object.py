"""Physics object model."""
from sqlalchemy import Column, String, ForeignKey, Float
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from ..base import BaseModel

class PhysicsObject(BaseModel):
    """Physics object model."""

    __tablename__ = "physics_objects"

    name = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False)
    universe_id = Column(UUID(as_uuid=True), ForeignKey("universes.id", ondelete="CASCADE"), nullable=False)
    scene_id = Column(UUID(as_uuid=True), ForeignKey("scenes.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Physics properties
    position = Column(JSONB, nullable=False, default=lambda: {"x": 0.0, "y": 0.0, "z": 0.0})
    rotation = Column(JSONB, nullable=False, default=lambda: {"x": 0.0, "y": 0.0, "z": 0.0})
    scale = Column(JSONB, nullable=False, default=lambda: {"x": 1.0, "y": 1.0, "z": 1.0})
    mass = Column(Float, nullable=False, default=1.0)
    velocity = Column(JSONB, nullable=False, default=lambda: {"x": 0.0, "y": 0.0, "z": 0.0})
    parameters = Column(JSONB, nullable=False, default=lambda: {})

    # Relationships
    universe = relationship("Universe", back_populates="physics_objects")
    scene = relationship("Scene", back_populates="physics_objects")
    user = relationship("User")

    def to_dict(self):
        """Convert to dictionary."""
        return {
            "id": str(self.id),
            "name": self.name,
            "type": self.type,
            "universe_id": str(self.universe_id),
            "scene_id": str(self.scene_id),
            "user_id": str(self.user_id),
            "position": self.position,
            "rotation": self.rotation,
            "scale": self.scale,
            "mass": self.mass,
            "velocity": self.velocity,
            "parameters": self.parameters,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }
