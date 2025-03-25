from datetime import datetime
from ..database import db
from .base import BaseModel

class PhysicsObject(BaseModel):
    __tablename__ = 'physics_objects'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    mass = db.Column(db.Float, default=1.0)
    position_x = db.Column(db.Float, default=0.0)
    position_y = db.Column(db.Float, default=0.0)
    position_z = db.Column(db.Float, default=0.0)
    velocity_x = db.Column(db.Float, default=0.0)
    velocity_y = db.Column(db.Float, default=0.0)
    velocity_z = db.Column(db.Float, default=0.0)
    rotation_x = db.Column(db.Float, default=0.0)
    rotation_y = db.Column(db.Float, default=0.0)
    rotation_z = db.Column(db.Float, default=0.0)
    angular_velocity_x = db.Column(db.Float, default=0.0)
    angular_velocity_y = db.Column(db.Float, default=0.0)
    angular_velocity_z = db.Column(db.Float, default=0.0)
    restitution = db.Column(db.Float, default=0.5)
    friction = db.Column(db.Float, default=0.3)
    linear_damping = db.Column(db.Float, default=0.1)
    angular_damping = db.Column(db.Float, default=0.1)
    collision_margin = db.Column(db.Float, default=0.04)
    is_static = db.Column(db.Boolean, default=False)
    is_trigger = db.Column(db.Boolean, default=False)
    physics_2d_id = db.Column(db.Integer, db.ForeignKey('physics_2d.id'))
    physics_3d_id = db.Column(db.Integer, db.ForeignKey('physics_3d.id'))
    
    def to_dict(self):
        base_dict = super().to_dict()
        base_dict.update({
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'mass': self.mass,
            'position': {
                'x': self.position_x,
                'y': self.position_y,
                'z': self.position_z
            },
            'velocity': {
                'x': self.velocity_x,
                'y': self.velocity_y,
                'z': self.velocity_z
            },
            'rotation': {
                'x': self.rotation_x,
                'y': self.rotation_y,
                'z': self.rotation_z
            },
            'angular_velocity': {
                'x': self.angular_velocity_x,
                'y': self.angular_velocity_y,
                'z': self.angular_velocity_z
            },
            'restitution': self.restitution,
            'friction': self.friction,
            'linear_damping': self.linear_damping,
            'angular_damping': self.angular_damping,
            'collision_margin': self.collision_margin,
            'is_static': self.is_static,
            'is_trigger': self.is_trigger,
            'physics_2d_id': self.physics_2d_id,
            'physics_3d_id': self.physics_3d_id
        })
        return base_dict 