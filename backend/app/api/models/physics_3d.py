from app import db
from datetime import datetime

class Physics3D(db.Model):
    __tablename__ = 'physics_3d'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    gravity_x = db.Column(db.Float, default=0.0)
    gravity_y = db.Column(db.Float, default=-9.8)  # Negative for downward
    gravity_z = db.Column(db.Float, default=0.0)
    friction = db.Column(db.Float, default=0.3)
    restitution = db.Column(db.Float, default=0.5)  # Bounce factor
    linear_damping = db.Column(db.Float, default=0.05)
    angular_damping = db.Column(db.Float, default=0.05)
    collision_margin = db.Column(db.Float, default=0.04)  # For collision detection
    continuous_detection = db.Column(db.Boolean, default=True)  # Continuous collision detection
    substeps = db.Column(db.Integer, default=2)  # Physics substeps per frame
    solver_iterations = db.Column(db.Integer, default=10)  # Constraint solver iterations
    time_scale = db.Column(db.Float, default=1.0)  # Physics simulation speed
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id'), nullable=True)
    scene_id = db.Column(db.Integer, db.ForeignKey('scenes.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    universe = db.relationship('Universe', back_populates='physics_3d')
    scene = db.relationship('Scene', back_populates='physics_3d')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'gravity_x': self.gravity_x,
            'gravity_y': self.gravity_y,
            'gravity_z': self.gravity_z,
            'friction': self.friction,
            'restitution': self.restitution,
            'linear_damping': self.linear_damping,
            'angular_damping': self.angular_damping,
            'collision_margin': self.collision_margin,
            'continuous_detection': self.continuous_detection,
            'substeps': self.substeps,
            'solver_iterations': self.solver_iterations,
            'time_scale': self.time_scale,
            'universe_id': self.universe_id,
            'scene_id': self.scene_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        } 