"""
Physics parameter model.
"""

from sqlalchemy import Column, Integer, Float, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class PhysicsParameter(Base):
    """Physics parameters for a scene."""
    __tablename__ = "physics_parameters"

    id = Column(Integer, primary_key=True, index=True)
    scene_id = Column(Integer, ForeignKey("scenes.id", ondelete="CASCADE"), unique=True)
    gravity = Column(Float, default=9.81)
    air_resistance = Column(Float, default=0.1)
    collision_elasticity = Column(Float, default=0.7)
    friction = Column(Float, default=0.3)

    # Relationships
    scene = relationship("Scene", back_populates="physics_parameters")

    def __repr__(self):
        """String representation."""
        return f"<PhysicsParameter(id={self.id}, scene_id={self.scene_id})>"
