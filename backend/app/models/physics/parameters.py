"""Physics parameters model."""
from sqlalchemy import Column, Integer, Float, ForeignKey, String, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from backend.app.db.base_class import Base
from backend.app.models.mixins import TimestampMixin
from uuid import uuid4

class PhysicsParameters(Base, TimestampMixin):
    """Physics parameters model."""
    __tablename__ = "physics_parameters"
    __table_args__ = {'extend_existing': True}

    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)

    # Global Physics Settings
    gravity = Column(Float, default=9.81)
    time_scale = Column(Float, default=1.0)
    air_resistance = Column(Float, default=0.0)

    # Collision Settings
    collision_elasticity = Column(Float, default=1.0)
    friction_coefficient = Column(Float, default=0.5)

    # Advanced Settings
    integration_method = Column(String, default="verlet")
    constraint_iterations = Column(Integer, default=10)
    custom_parameters = Column(JSON, nullable=True)

    # Relationships
    universe_id = Column(UUID(as_uuid=True), ForeignKey("universes.id"), nullable=False)
    scene_id = Column(UUID(as_uuid=True), ForeignKey("scenes.id"), nullable=True)
    universe = relationship("Universe", back_populates="physics_parameters")
    scene = relationship("Scene", back_populates="physics_parameters")

    def to_dict(self):
        """Convert model to dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "gravity": self.gravity,
            "time_scale": self.time_scale,
            "air_resistance": self.air_resistance,
            "collision_elasticity": self.collision_elasticity,
            "friction_coefficient": self.friction_coefficient,
            "integration_method": self.integration_method,
            "constraint_iterations": self.constraint_iterations,
            "custom_parameters": self.custom_parameters,
            "universe_id": self.universe_id,
            "scene_id": self.scene_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

    @staticmethod
    def from_dict(data):
        """Create model from dictionary."""
        return PhysicsParameters(
            name=data.get("name"),
            description=data.get("description"),
            gravity=data.get("gravity", 9.81),
            time_scale=data.get("time_scale", 1.0),
            air_resistance=data.get("air_resistance", 0.0),
            collision_elasticity=data.get("collision_elasticity", 1.0),
            friction_coefficient=data.get("friction_coefficient", 0.5),
            integration_method=data.get("integration_method", "verlet"),
            constraint_iterations=data.get("constraint_iterations", 10),
            custom_parameters=data.get("custom_parameters"),
            universe_id=data.get("universe_id"),
            scene_id=data.get("scene_id")
        )
