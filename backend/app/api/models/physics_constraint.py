from app import db
from datetime import datetime

class PhysicsConstraint(db.Model):
    __tablename__ = 'physics_constraints'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    constraint_type = db.Column(db.String(50), nullable=False)  # hinge, fixed, slider, etc.
    
    # Object references (the two objects being constrained)
    object_a_id = db.Column(db.Integer, db.ForeignKey('physics_objects.id'), nullable=False)
    object_b_id = db.Column(db.Integer, db.ForeignKey('physics_objects.id'), nullable=True)  # Can be null for world constraints
    
    # Constraint parameters
    breaking_threshold = db.Column(db.Float, nullable=True)  # Force threshold to break constraint
    
    # Position for the constraint (pivot point)
    position_x = db.Column(db.Float, default=0.0)
    position_y = db.Column(db.Float, default=0.0)
    position_z = db.Column(db.Float, default=0.0)
    
    # Axis for the constraint (for hinges, etc.)
    axis_x = db.Column(db.Float, default=0.0)
    axis_y = db.Column(db.Float, default=1.0)
    axis_z = db.Column(db.Float, default=0.0)
    
    # Limits
    limit_lower = db.Column(db.Float, nullable=True)
    limit_upper = db.Column(db.Float, nullable=True)
    
    # Spring properties
    spring_stiffness = db.Column(db.Float, nullable=True)
    spring_damping = db.Column(db.Float, nullable=True)
    
    # Misc
    is_2d = db.Column(db.Boolean, default=True)  # Whether this is for 2D or 3D physics
    is_enabled = db.Column(db.Boolean, default=True)
    
    # Foreign keys
    scene_id = db.Column(db.Integer, db.ForeignKey('scenes.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    object_a = db.relationship('PhysicsObject', foreign_keys=[object_a_id], backref=db.backref('constraints_a', lazy=True))
    object_b = db.relationship('PhysicsObject', foreign_keys=[object_b_id], backref=db.backref('constraints_b', lazy=True))
    scene = db.relationship('Scene', backref=db.backref('physics_constraints', lazy=True))
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'constraint_type': self.constraint_type,
            'object_a_id': self.object_a_id,
            'object_b_id': self.object_b_id,
            'breaking_threshold': self.breaking_threshold,
            'position': {
                'x': self.position_x,
                'y': self.position_y,
                'z': self.position_z
            },
            'axis': {
                'x': self.axis_x,
                'y': self.axis_y,
                'z': self.axis_z
            },
            'limit_lower': self.limit_lower,
            'limit_upper': self.limit_upper,
            'spring_stiffness': self.spring_stiffness,
            'spring_damping': self.spring_damping,
            'is_2d': self.is_2d,
            'is_enabled': self.is_enabled,
            'scene_id': self.scene_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        } 