"""Physics constraint model module."""
from sqlalchemy import Column, Integer, String, Float, ForeignKey, JSON, Index
from sqlalchemy.orm import relationship, Mapped, mapped_column
from typing import Dict, Any
from datetime import datetime
from .. import db
from .base_models import BaseModel, TimestampMixin

class PhysicsConstraint(BaseModel, TimestampMixin):
    """Physics constraint model for connecting physics objects."""

    __tablename__ = 'physics_constraints'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    scene_id: Mapped[int] = mapped_column(Integer, ForeignKey('scenes.id', ondelete='CASCADE'), nullable=False)
    object_a_id: Mapped[int] = mapped_column(Integer, ForeignKey('physics_objects.id', ondelete='CASCADE'), nullable=False)
    object_b_id: Mapped[int] = mapped_column(Integer, ForeignKey('physics_objects.id', ondelete='CASCADE'), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    constraint_type: Mapped[str] = mapped_column(String(50), nullable=False)  # 'distance', 'revolute', 'prismatic'

    # Constraint properties
    anchor_a: Mapped[Dict[str, float]] = mapped_column(JSON, nullable=False)  # {x: float, y: float}
    anchor_b: Mapped[Dict[str, float]] = mapped_column(JSON, nullable=False)  # {x: float, y: float}

    # Common properties
    stiffness: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    damping: Mapped[float] = mapped_column(Float, nullable=False, default=0.7)

    # Type-specific properties
    properties: Mapped[Dict[str, Any]] = mapped_column(
        JSON,
        nullable=False,
        default=lambda: {
            "min_length": None,  # For distance constraints
            "max_length": None,  # For distance constraints
            "angle_limits": None,  # For revolute constraints {min: float, max: float}
            "axis": {"x": 1, "y": 0},  # For prismatic constraints
            "translation_limits": None  # For prismatic constraints {min: float, max: float}
        }
    )

    # Relationships
    scene = relationship('Scene', back_populates='physics_constraints')
    object_a = relationship('PhysicsObject', foreign_keys=[object_a_id], back_populates='constraints_as_a')
    object_b = relationship('PhysicsObject', foreign_keys=[object_b_id], back_populates='constraints_as_b')

    # Indexes for better query performance
    __table_args__ = (
        Index('ix_physics_constraints_scene_id', 'scene_id'),
        Index('ix_physics_constraints_object_a_id', 'object_a_id'),
        Index('ix_physics_constraints_object_b_id', 'object_b_id'),
    )

    def validate_constraint_type(self):
        """Validate constraint type and required properties."""
        valid_types = {'distance', 'revolute', 'prismatic'}
        if self.constraint_type not in valid_types:
            raise ValueError(f"Invalid constraint type. Must be one of: {valid_types}")

        if self.constraint_type == 'distance':
            if self.properties.get('min_length') is not None:
                if not isinstance(self.properties['min_length'], (int, float)):
                    raise ValueError("min_length must be a number")
            if self.properties.get('max_length') is not None:
                if not isinstance(self.properties['max_length'], (int, float)):
                    raise ValueError("max_length must be a number")
                if self.properties.get('min_length') is not None:
                    if self.properties['max_length'] < self.properties['min_length']:
                        raise ValueError("max_length must be greater than min_length")

        elif self.constraint_type == 'revolute':
            angle_limits = self.properties.get('angle_limits')
            if angle_limits is not None:
                if not isinstance(angle_limits, dict):
                    raise ValueError("angle_limits must be a dictionary")
                if 'min' not in angle_limits or 'max' not in angle_limits:
                    raise ValueError("angle_limits must contain 'min' and 'max' values")
                if not isinstance(angle_limits['min'], (int, float)):
                    raise ValueError("angle_limits.min must be a number")
                if not isinstance(angle_limits['max'], (int, float)):
                    raise ValueError("angle_limits.max must be a number")
                if angle_limits['max'] < angle_limits['min']:
                    raise ValueError("angle_limits.max must be greater than angle_limits.min")

        elif self.constraint_type == 'prismatic':
            axis = self.properties.get('axis')
            if not isinstance(axis, dict) or 'x' not in axis or 'y' not in axis:
                raise ValueError("axis must be a dictionary with 'x' and 'y' components")
            if not isinstance(axis['x'], (int, float)) or not isinstance(axis['y'], (int, float)):
                raise ValueError("axis components must be numbers")

            translation_limits = self.properties.get('translation_limits')
            if translation_limits is not None:
                if not isinstance(translation_limits, dict):
                    raise ValueError("translation_limits must be a dictionary")
                if 'min' not in translation_limits or 'max' not in translation_limits:
                    raise ValueError("translation_limits must contain 'min' and 'max' values")
                if not isinstance(translation_limits['min'], (int, float)):
                    raise ValueError("translation_limits.min must be a number")
                if not isinstance(translation_limits['max'], (int, float)):
                    raise ValueError("translation_limits.max must be a number")
                if translation_limits['max'] < translation_limits['min']:
                    raise ValueError("translation_limits.max must be greater than translation_limits.min")

    def to_dict(self) -> Dict[str, Any]:
        """Convert physics constraint to dictionary."""
        return {
            'id': self.id,
            'scene_id': self.scene_id,
            'object_a_id': self.object_a_id,
            'object_b_id': self.object_b_id,
            'name': self.name,
            'constraint_type': self.constraint_type,
            'anchor_a': self.anchor_a,
            'anchor_b': self.anchor_b,
            'stiffness': self.stiffness,
            'damping': self.damping,
            'properties': self.properties,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def apply_constraint_forces(self):
        """Apply forces to maintain the constraint."""
        if self.constraint_type == 'distance':
            self._apply_distance_constraint()
        elif self.constraint_type == 'spring':
            self._apply_spring_constraint()
        # Add more constraint types as needed

    def _apply_distance_constraint(self):
        """Apply forces for distance constraint."""
        # Calculate current distance
        dx = self.object_b.position['x'] - self.object_a.position['x']
        dy = self.object_b.position['y'] - self.object_a.position['y']
        current_distance = (dx * dx + dy * dy) ** 0.5

        if current_distance == 0:
            return

        # Calculate force magnitude
        force_magnitude = self.stiffness * (current_distance - self.length)

        # Calculate force components
        force_x = (dx / current_distance) * force_magnitude
        force_y = (dy / current_distance) * force_magnitude

        # Apply forces
        self.object_a.apply_force(force_x, force_y)
        self.object_b.apply_force(-force_x, -force_y)

    def _apply_spring_constraint(self):
        """Apply forces for spring constraint."""
        # Calculate current distance and velocity
        dx = self.object_b.position['x'] - self.object_a.position['x']
        dy = self.object_b.position['y'] - self.object_a.position['y']
        current_distance = (dx * dx + dy * dy) ** 0.5

        if current_distance == 0:
            return

        # Calculate relative velocity
        dvx = self.object_b.velocity['x'] - self.object_a.velocity['x']
        dvy = self.object_b.velocity['y'] - self.object_a.velocity['y']

        # Calculate spring force
        spring_force_x = self.stiffness * (dx / current_distance) * (current_distance - self.length)
        spring_force_y = self.stiffness * (dy / current_distance) * (current_distance - self.length)

        # Calculate damping force
        damping_force_x = self.damping * dvx
        damping_force_y = self.damping * dvy

        # Apply total forces
        total_force_x = spring_force_x + damping_force_x
        total_force_y = spring_force_y + damping_force_y

        self.object_a.apply_force(total_force_x, total_force_y)
        self.object_b.apply_force(-total_force_x, -total_force_y)
