"""Physics object model module."""
from sqlalchemy import (
    Column, Integer, String, Float, ForeignKey,
    JSON, Boolean, Index
)
from sqlalchemy.orm import relationship, Mapped, mapped_column
from typing import Dict, Any, List
from .base_models import BaseModel, TimestampMixin
from .physics_constraint import PhysicsConstraint
from .scene import Scene


class PhysicsObject(BaseModel, TimestampMixin):
    """Physics object model for simulation."""

    __tablename__ = 'physics_objects'

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True
    )
    scene_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey('scenes.id', ondelete='CASCADE'),
        nullable=False
    )
    object_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )
    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )
    position: Mapped[Dict[str, float]] = mapped_column(
        JSON,
        default=lambda: {"x": 0, "y": 0}
    )
    velocity: Mapped[Dict[str, float]] = mapped_column(
        JSON,
        default=lambda: {"x": 0, "y": 0}
    )
    dimensions: Mapped[Dict[str, float]] = mapped_column(
        JSON,
        default=lambda: {"width": 1, "height": 1}
    )
    angle: Mapped[float] = mapped_column(
        Float,
        default=0
    )
    angular_velocity: Mapped[float] = mapped_column(
        Float,
        default=0
    )
    collision_filter: Mapped[Dict[str, Any]] = mapped_column(
        JSON,
        default=lambda: {
            "category": 1,
            "mask": 4294967295,
            "group": 0
        }
    )
    density: Mapped[float] = mapped_column(
        Float,
        default=0.001
    )
    restitution: Mapped[float] = mapped_column(
        Float,
        default=0
    )
    friction: Mapped[float] = mapped_column(
        Float,
        default=0.1
    )
    is_static: Mapped[bool] = mapped_column(
        Boolean,
        default=False
    )
    is_sensor: Mapped[bool] = mapped_column(
        Boolean,
        default=False
    )
    render_options: Mapped[Dict[str, Any]] = mapped_column(
        JSON,
        default=lambda: {
            "fillStyle": "#ffffff",
            "strokeStyle": "#000000",
            "lineWidth": 1
        }
    )

    # Relationships
    scene: Mapped["Scene"] = relationship(
        "Scene",
        back_populates="physics_objects"
    )
    constraints_as_a: Mapped[List["PhysicsConstraint"]] = relationship(
        "PhysicsConstraint",
        foreign_keys='PhysicsConstraint.object_a_id',
        back_populates='object_a',
        cascade='all, delete-orphan',
        passive_deletes=True
    )
    constraints_as_b: Mapped[List["PhysicsConstraint"]] = relationship(
        "PhysicsConstraint",
        foreign_keys='PhysicsConstraint.object_b_id',
        back_populates='object_b',
        cascade='all, delete-orphan',
        passive_deletes=True
    )

    # Indexes
    __table_args__ = (
        Index('idx_physics_objects_scene_id', 'scene_id'),
    )

    def validate_object_type(self):
        """Validate object type and required dimensions."""
        valid_types = {'circle', 'rectangle', 'polygon'}
        if self.object_type not in valid_types:
            raise ValueError(f"Invalid object type. Must be one of: {valid_types}")

        if self.object_type == 'circle':
            if 'radius' not in self.dimensions:
                raise ValueError("Circle objects must have a radius dimension")
            if not isinstance(self.dimensions['radius'], (int, float)):
                raise ValueError("Radius must be a number")
            if self.dimensions['radius'] <= 0:
                raise ValueError("Radius must be positive")

        elif self.object_type == 'rectangle':
            required = {'width', 'height'}
            if not all(dim in self.dimensions for dim in required):
                raise ValueError("Rectangle objects must have width and height dimensions")
            if not all(isinstance(self.dimensions[dim], (int, float)) for dim in required):
                raise ValueError("Width and height must be numbers")
            if not all(self.dimensions[dim] > 0 for dim in required):
                raise ValueError("Width and height must be positive")

        elif self.object_type == 'polygon':
            if 'vertices' not in self.dimensions:
                raise ValueError("Polygon objects must have vertices")
            if not isinstance(self.dimensions['vertices'], list):
                raise ValueError("Vertices must be a list")
            if len(self.dimensions['vertices']) < 3:
                raise ValueError("Polygons must have at least 3 vertices")
            for vertex in self.dimensions['vertices']:
                if not isinstance(vertex, dict) or 'x' not in vertex or 'y' not in vertex:
                    raise ValueError("Each vertex must be a dictionary with 'x' and 'y' coordinates")
                if not isinstance(vertex['x'], (int, float)) or not isinstance(vertex['y'], (int, float)):
                    raise ValueError("Vertex coordinates must be numbers")

    def validate_physics_properties(self):
        """Validate physics properties."""
        if self.mass <= 0 and not self.is_static:
            raise ValueError("Mass must be positive for non-static objects")

        if not isinstance(self.position, dict) or 'x' not in self.position or 'y' not in self.position:
            raise ValueError("Position must be a dictionary with 'x' and 'y' coordinates")
        if not isinstance(self.velocity, dict) or 'x' not in self.velocity or 'y' not in self.velocity:
            raise ValueError("Velocity must be a dictionary with 'x' and 'y' components")
        if not isinstance(self.acceleration, dict) or 'x' not in self.acceleration or 'y' not in self.acceleration:
            raise ValueError("Acceleration must be a dictionary with 'x' and 'y' components")

        if self.restitution < 0 or self.restitution > 1:
            raise ValueError("Restitution must be between 0 and 1")
        if self.friction < 0:
            raise ValueError("Friction must be non-negative")

    @property
    def constraints(self) -> List["PhysicsConstraint"]:
        """Get all constraints associated with this object."""
        return self.constraints_as_a + self.constraints_as_b

    def to_dict(self) -> Dict[str, Any]:
        """Convert physics object to dictionary."""
        return {
            'id': self.id,
            'scene_id': self.scene_id,
            'object_type': self.object_type,
            'name': self.name,
            'position': self.position,
            'velocity': self.velocity,
            'dimensions': self.dimensions,
            'angle': self.angle,
            'angular_velocity': self.angular_velocity,
            'collision_filter': self.collision_filter,
            'density': self.density,
            'restitution': self.restitution,
            'friction': self.friction,
            'is_static': self.is_static,
            'is_sensor': self.is_sensor,
            'render_options': self.render_options,
            'created_at': (
                self.created_at.isoformat()
                if self.created_at else None
            ),
            'updated_at': (
                self.updated_at.isoformat()
                if self.updated_at else None
            )
        }

    def apply_force(self, force_x, force_y):
        """Apply a force to the object."""
        if not self.is_static:
            self.acceleration['x'] += force_x / self.mass
            self.acceleration['y'] += force_y / self.mass

    def update_physics(self, delta_time):
        """Update physics state for the given time step."""
        if not self.is_static:
            # Update velocity
            self.velocity['x'] += self.acceleration['x'] * delta_time
            self.velocity['y'] += self.acceleration['y'] * delta_time

            # Update position
            self.position['x'] += self.velocity['x'] * delta_time
            self.position['y'] += self.velocity['y'] * delta_time

            # Update angle
            self.angle += self.angular_velocity * delta_time

            # Reset acceleration
            self.acceleration['x'] = 0
            self.acceleration['y'] = 0
