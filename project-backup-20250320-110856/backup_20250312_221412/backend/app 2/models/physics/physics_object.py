"""
Physics object model.
"""

from sqlalchemy import Column, Integer, String, Float, ForeignKey, Boolean, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from ..base import BaseModel

class PhysicsObject(BaseModel):
    """Physical object in a scene."""
    __tablename__ = "physics_objects"

    name = Column(String, index=True)
    scene_id = Column(UUID(as_uuid=True), ForeignKey("scenes.id", ondelete="CASCADE"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    mass = Column(Float, default=1.0)
    position = Column(JSON, default=lambda: {"x": 0.0, "y": 0.0, "z": 0.0})
    velocity = Column(JSON, default=lambda: {"x": 0.0, "y": 0.0, "z": 0.0})
    acceleration = Column(JSON, default=lambda: {"x": 0.0, "y": 0.0, "z": 0.0})
    rotation = Column(JSON, default=lambda: {"x": 0.0, "y": 0.0, "z": 0.0})
    angular_velocity = Column(JSON, default=lambda: {"x": 0.0, "y": 0.0, "z": 0.0})
    scale = Column(JSON, default=lambda: {"x": 1.0, "y": 1.0, "z": 1.0})
    is_static = Column(Boolean, default=False)
    is_trigger = Column(Boolean, default=False)
    collision_shape = Column(String, default="box")
    collision_params = Column(JSON, default=dict)
    material_properties = Column(
        JSON,
        default=lambda: {
            "restitution": 0.7,
            "friction": 0.3,
            "density": 1.0
        }
    )

    # Relationships
    user = relationship("User", back_populates="physics_objects")
    scene = relationship("Scene", back_populates="physics_objects")
    constraints_a = relationship(
        "PhysicsConstraint",
        foreign_keys="[PhysicsConstraint.object_a_id]",
        back_populates="object_a"
    )
    constraints_b = relationship(
        "PhysicsConstraint",
        foreign_keys="[PhysicsConstraint.object_b_id]",
        back_populates="object_b"
    )

    def __repr__(self):
        """String representation."""
        return f"<PhysicsObject(id={self.id}, name='{self.name}', scene_id={self.scene_id})>"

    def to_dict(self):
        """Convert object to dictionary for physics engine."""
        return {
            "id": self.id,
            "name": self.name,
            "mass": self.mass,
            "position": self.position,
            "velocity": self.velocity,
            "acceleration": self.acceleration,
            "rotation": self.rotation,
            "angular_velocity": self.angular_velocity,
            "scale": self.scale,
            "is_static": self.is_static,
            "is_trigger": self.is_trigger,
            "collision_shape": self.collision_shape,
            "collision_params": self.collision_params,
            "material_properties": self.material_properties,
            "user_id": self.user_id,
            "scene_id": self.scene_id,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }
