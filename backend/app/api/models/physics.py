from .base import BaseModel
from ..models.database import db

class PhysicsObject(BaseModel):
    __tablename__ = 'physics_objects'
    
    name = db.Column(db.String(100), nullable=False, index=True)
    description = db.Column(db.Text)
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id', ondelete='CASCADE'), nullable=False, index=True)
    scene_id = db.Column(db.Integer, db.ForeignKey('scenes.id', ondelete='CASCADE'), index=True)
    position_x = db.Column(db.Float, nullable=False, default=0.0)
    position_y = db.Column(db.Float, nullable=False, default=0.0)
    position_z = db.Column(db.Float, nullable=False, default=0.0)
    rotation_x = db.Column(db.Float, nullable=False, default=0.0)
    rotation_y = db.Column(db.Float, nullable=False, default=0.0)
    rotation_z = db.Column(db.Float, nullable=False, default=0.0)
    scale_x = db.Column(db.Float, nullable=False, default=1.0)
    scale_y = db.Column(db.Float, nullable=False, default=1.0)
    scale_z = db.Column(db.Float, nullable=False, default=1.0)
    mass = db.Column(db.Float, nullable=False, default=1.0)
    restitution = db.Column(db.Float, nullable=False, default=0.5)
    friction = db.Column(db.Float, nullable=False, default=0.5)
    linear_damping = db.Column(db.Float, nullable=False, default=0.0)
    angular_damping = db.Column(db.Float, nullable=False, default=0.0)
    is_static = db.Column(db.Boolean, nullable=False, default=False)
    is_trigger = db.Column(db.Boolean, nullable=False, default=False)
    shape_type = db.Column(db.String(50), nullable=False, default='box')
    shape_data = db.Column(db.JSON)
    
    def validate(self):
        """Validate physics object data."""
        if not self.name:
            raise ValueError("Object name is required")
        if not self.universe_id:
            raise ValueError("Universe ID is required")
        if self.mass < 0:
            raise ValueError("Mass cannot be negative")
        if not 0 <= self.restitution <= 1:
            raise ValueError("Restitution must be between 0 and 1")
        if not 0 <= self.friction <= 1:
            raise ValueError("Friction must be between 0 and 1")
            
    def to_dict(self):
        """Convert physics object to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'universe_id': self.universe_id,
            'scene_id': self.scene_id,
            'position': {'x': self.position_x, 'y': self.position_y, 'z': self.position_z},
            'rotation': {'x': self.rotation_x, 'y': self.rotation_y, 'z': self.rotation_z},
            'scale': {'x': self.scale_x, 'y': self.scale_y, 'z': self.scale_z},
            'mass': self.mass,
            'restitution': self.restitution,
            'friction': self.friction,
            'linear_damping': self.linear_damping,
            'angular_damping': self.angular_damping,
            'is_static': self.is_static,
            'is_trigger': self.is_trigger,
            'shape_type': self.shape_type,
            'shape_data': self.shape_data,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'is_deleted': self.is_deleted
        }

class Physics2D(BaseModel):
    __tablename__ = 'physics_2d'
    
    name = db.Column(db.String(100), nullable=False, index=True)
    description = db.Column(db.Text)
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id', ondelete='CASCADE'), nullable=False, index=True)
    scene_id = db.Column(db.Integer, db.ForeignKey('scenes.id', ondelete='CASCADE'), index=True)
    gravity_x = db.Column(db.Float, nullable=False, default=0.0)
    gravity_y = db.Column(db.Float, nullable=False, default=-9.81)
    allow_sleep = db.Column(db.Boolean, nullable=False, default=True)
    warm_starting = db.Column(db.Boolean, nullable=False, default=True)
    continuous_physics = db.Column(db.Boolean, nullable=False, default=True)
    sub_stepping = db.Column(db.Boolean, nullable=False, default=False)
    velocity_iterations = db.Column(db.Integer, nullable=False, default=8)
    position_iterations = db.Column(db.Integer, nullable=False, default=6)
    
    def validate(self):
        """Validate 2D physics settings."""
        if not self.name:
            raise ValueError("Name is required")
        if not self.universe_id:
            raise ValueError("Universe ID is required")
        if self.velocity_iterations < 1:
            raise ValueError("Velocity iterations must be positive")
        if self.position_iterations < 1:
            raise ValueError("Position iterations must be positive")
            
    def to_dict(self):
        """Convert 2D physics settings to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'universe_id': self.universe_id,
            'scene_id': self.scene_id,
            'gravity': {'x': self.gravity_x, 'y': self.gravity_y},
            'allow_sleep': self.allow_sleep,
            'warm_starting': self.warm_starting,
            'continuous_physics': self.continuous_physics,
            'sub_stepping': self.sub_stepping,
            'velocity_iterations': self.velocity_iterations,
            'position_iterations': self.position_iterations,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'is_deleted': self.is_deleted
        }

class Physics3D(BaseModel):
    __tablename__ = 'physics_3d'
    
    name = db.Column(db.String(100), nullable=False, index=True)
    description = db.Column(db.Text)
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id', ondelete='CASCADE'), nullable=False, index=True)
    scene_id = db.Column(db.Integer, db.ForeignKey('scenes.id', ondelete='CASCADE'), index=True)
    gravity_x = db.Column(db.Float, nullable=False, default=0.0)
    gravity_y = db.Column(db.Float, nullable=False, default=-9.81)
    gravity_z = db.Column(db.Float, nullable=False, default=0.0)
    allow_sleep = db.Column(db.Boolean, nullable=False, default=True)
    warm_starting = db.Column(db.Boolean, nullable=False, default=True)
    continuous_physics = db.Column(db.Boolean, nullable=False, default=True)
    sub_stepping = db.Column(db.Boolean, nullable=False, default=False)
    solver_iterations = db.Column(db.Integer, nullable=False, default=10)
    solver_tolerance = db.Column(db.Float, nullable=False, default=0.001)
    
    def validate(self):
        """Validate 3D physics settings."""
        if not self.name:
            raise ValueError("Name is required")
        if not self.universe_id:
            raise ValueError("Universe ID is required")
        if self.solver_iterations < 1:
            raise ValueError("Solver iterations must be positive")
        if self.solver_tolerance <= 0:
            raise ValueError("Solver tolerance must be positive")
            
    def to_dict(self):
        """Convert 3D physics settings to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'universe_id': self.universe_id,
            'scene_id': self.scene_id,
            'gravity': {'x': self.gravity_x, 'y': self.gravity_y, 'z': self.gravity_z},
            'allow_sleep': self.allow_sleep,
            'warm_starting': self.warm_starting,
            'continuous_physics': self.continuous_physics,
            'sub_stepping': self.sub_stepping,
            'solver_iterations': self.solver_iterations,
            'solver_tolerance': self.solver_tolerance,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'is_deleted': self.is_deleted
        }

class PhysicsConstraint(BaseModel):
    __tablename__ = 'physics_constraints'
    
    name = db.Column(db.String(100), nullable=False, index=True)
    description = db.Column(db.Text)
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id', ondelete='CASCADE'), nullable=False, index=True)
    scene_id = db.Column(db.Integer, db.ForeignKey('scenes.id', ondelete='CASCADE'), index=True)
    body_a_id = db.Column(db.Integer, db.ForeignKey('physics_objects.id', ondelete='CASCADE'), nullable=False, index=True)
    body_b_id = db.Column(db.Integer, db.ForeignKey('physics_objects.id', ondelete='CASCADE'), nullable=False, index=True)
    constraint_type = db.Column(db.String(50), nullable=False)
    constraint_data = db.Column(db.JSON)
    enable_collision = db.Column(db.Boolean, nullable=False, default=True)
    break_force = db.Column(db.Float, nullable=True)
    break_torque = db.Column(db.Float, nullable=True)
    
    def validate(self):
        """Validate physics constraint data."""
        if not self.name:
            raise ValueError("Constraint name is required")
        if not self.universe_id:
            raise ValueError("Universe ID is required")
        if not self.body_a_id:
            raise ValueError("Body A ID is required")
        if not self.body_b_id:
            raise ValueError("Body B ID is required")
        if not self.constraint_type:
            raise ValueError("Constraint type is required")
        if self.break_force is not None and self.break_force <= 0:
            raise ValueError("Break force must be positive")
        if self.break_torque is not None and self.break_torque <= 0:
            raise ValueError("Break torque must be positive")
            
    def to_dict(self):
        """Convert physics constraint to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'universe_id': self.universe_id,
            'scene_id': self.scene_id,
            'body_a_id': self.body_a_id,
            'body_b_id': self.body_b_id,
            'constraint_type': self.constraint_type,
            'constraint_data': self.constraint_data,
            'enable_collision': self.enable_collision,
            'break_force': self.break_force,
            'break_torque': self.break_torque,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'is_deleted': self.is_deleted
        } 