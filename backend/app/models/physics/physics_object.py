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
    universe_id = Column(UUID(as_uuid=True), ForeignKey("universes.id", ondelete="CASCADE"))
    scene_id = Column(UUID(as_uuid=True), ForeignKey("scenes.id", ondelete="CASCADE"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))

    # Physics properties
    position = Column(JSONB)  # {x: float, y: float, z: float}
    rotation = Column(JSONB)  # {x: float, y: float, z: float}
    scale = Column(JSONB)    # {x: float, y: float, z: float}
    mass = Column(Float)
    velocity = Column(JSONB)  # {x: float, y: float, z: float}
    parameters = Column(JSONB)

    # Relationships
    universe = relationship("Universe", back_populates="physics_objects")
    scene = relationship("Scene", back_populates="physics_objects")
    user = relationship("User")

    def to_dict(self):
        """Convert to dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "type": self.type,
            "universe_id": self.universe_id,
            "scene_id": self.scene_id,
            "user_id": self.user_id,
            "position": self.position,
            "rotation": self.rotation,
            "scale": self.scale,
            "mass": self.mass,
            "velocity": self.velocity,
            "parameters": self.parameters,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }
