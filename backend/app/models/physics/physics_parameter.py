"""
Physics parameter model.
"""

from sqlalchemy import Column, Float, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.core.base import BaseModel

class PhysicsParameter(BaseModel):
    """Physics parameters for a scene."""
    __tablename__ = "physics_parameters"

    scene_id = Column(UUID(as_uuid=True), ForeignKey("scenes.id", ondelete="CASCADE"), unique=True)
    gravity = Column(Float, default=9.81)
    air_resistance = Column(Float, default=0.1)
    collision_elasticity = Column(Float, default=0.7)
    friction = Column(Float, default=0.3)

    # Relationships
    scene = relationship("Scene", back_populates="physics_parameters")

    # Ensure scenes table is created first
    __table_args__ = {'extend_existing': True}

    def __repr__(self):
        """String representation."""
        return f"<PhysicsParameter(id={self.id}, scene_id={self.scene_id})>"

    def to_dict(self):
        """Convert to dictionary."""
        return {
            "id": self.id,
            "scene_id": self.scene_id,
            "gravity": self.gravity,
            "air_resistance": self.air_resistance,
            "collision_elasticity": self.collision_elasticity,
            "friction": self.friction,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }
