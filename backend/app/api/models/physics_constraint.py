from datetime import datetime
from ..database import db
from .base import BaseModel

class PhysicsConstraint(BaseModel):
    __tablename__ = 'physics_constraints'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    constraint_type = db.Column(db.String(50), nullable=False)  # point-to-point, hinge, etc.
    object_a_id = db.Column(db.Integer, db.ForeignKey('physics_objects.id'), nullable=False)
    object_b_id = db.Column(db.Integer, db.ForeignKey('physics_objects.id'), nullable=False)
    pivot_a_x = db.Column(db.Float, default=0.0)
    pivot_a_y = db.Column(db.Float, default=0.0)
    pivot_a_z = db.Column(db.Float, default=0.0)
    pivot_b_x = db.Column(db.Float, default=0.0)
    pivot_b_y = db.Column(db.Float, default=0.0)
    pivot_b_z = db.Column(db.Float, default=0.0)
    axis_a_x = db.Column(db.Float, default=0.0)
    axis_a_y = db.Column(db.Float, default=0.0)
    axis_a_z = db.Column(db.Float, default=0.0)
    axis_b_x = db.Column(db.Float, default=0.0)
    axis_b_y = db.Column(db.Float, default=0.0)
    axis_b_z = db.Column(db.Float, default=0.0)
    max_force = db.Column(db.Float, default=1e6)
    max_torque = db.Column(db.Float, default=1e6)
    breaking_force = db.Column(db.Float, default=1e6)
    breaking_torque = db.Column(db.Float, default=1e6)
    is_enabled = db.Column(db.Boolean, default=True)
    
    # Relationships
    object_a = db.relationship('PhysicsObject', foreign_keys=[object_a_id], backref=db.backref('constraints_as_a', lazy=True))
    object_b = db.relationship('PhysicsObject', foreign_keys=[object_b_id], backref=db.backref('constraints_as_b', lazy=True))
    
    def to_dict(self):
        base_dict = super().to_dict()
        base_dict.update({
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'constraint_type': self.constraint_type,
            'object_a_id': self.object_a_id,
            'object_b_id': self.object_b_id,
            'pivot_a': {
                'x': self.pivot_a_x,
                'y': self.pivot_a_y,
                'z': self.pivot_a_z
            },
            'pivot_b': {
                'x': self.pivot_b_x,
                'y': self.pivot_b_y,
                'z': self.pivot_b_z
            },
            'axis_a': {
                'x': self.axis_a_x,
                'y': self.axis_a_y,
                'z': self.axis_a_z
            },
            'axis_b': {
                'x': self.axis_b_x,
                'y': self.axis_b_y,
                'z': self.axis_b_z
            },
            'max_force': self.max_force,
            'max_torque': self.max_torque,
            'breaking_force': self.breaking_force,
            'breaking_torque': self.breaking_torque,
            'is_enabled': self.is_enabled
        })
        return base_dict 