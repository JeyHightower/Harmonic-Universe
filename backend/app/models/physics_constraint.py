"""
Physics constraint model.
"""

from sqlalchemy import Column, Integer, String, Float, ForeignKey, Boolean, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from ..base import BaseModel

class PhysicsConstraint(BaseModel):
    """Physical constraint between objects in a scene."""
    __tablename__ = "physics_constraints"

    name = Column(String, index=True)
    scene_id = Column(UUID(as_uuid=True), ForeignKey("scenes.id", ondelete="CASCADE"))
    constraint_type = Column(String)
    object_a_id = Column(UUID(as_uuid=True), ForeignKey("physics_objects.id", ondelete="CASCADE"))
    object_b_id = Column(UUID(as_uuid=True), ForeignKey("physics_objects.id", ondelete="CASCADE"), nullable=True)
    anchor_a = Column(JSON, default=lambda: {"x": 0.0, "y": 0.0, "z": 0.0})
    anchor_b = Column(JSON, nullable=True)
    axis_a = Column(JSON, default=lambda: {"x": 0.0, "y": 1.0, "z": 0.0})
    axis_b = Column(JSON, nullable=True)
    limits = Column(JSON, default=dict)
    spring_properties = Column(JSON, nullable=True)
    breaking_force = Column(Float, nullable=True)
    enabled = Column(Boolean, default=True)

    # Relationships
    scene = relationship("Scene", back_populates="physics_constraints")
    object_a = relationship(
        "PhysicsObject",
        foreign_keys=[object_a_id],
        back_populates="constraints_a"
    )
    object_b = relationship(
        "PhysicsObject",
        foreign_keys=[object_b_id],
        back_populates="constraints_b"
    )

    def __repr__(self):
        """String representation."""
        return (
            f"<PhysicsConstraint(id={self.id}, name='{self.name}', "
            f"type='{self.constraint_type}', scene_id={self.scene_id})>"
        )

    def to_dict(self):
        """Convert constraint to dictionary for physics engine."""
        return {
            "id": self.id,
            "name": self.name,
            "constraint_type": self.constraint_type,
            "object_a_id": self.object_a_id,
            "object_b_id": self.object_b_id,
            "anchor_a": self.anchor_a,
            "anchor_b": self.anchor_b,
            "axis_a": self.axis_a,
            "axis_b": self.axis_b,
            "limits": self.limits,
            "spring_properties": self.spring_properties,
            "breaking_force": self.breaking_force,
            "enabled": self.enabled,
            "scene_id": self.scene_id,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }
