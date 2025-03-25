from app import db
from datetime import datetime

class Physics2D(db.Model):
    __tablename__ = 'physics_2d'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    gravity_x = db.Column(db.Float, default=0.0)  # Horizontal gravity
    gravity_y = db.Column(db.Float, default=9.8)  # Vertical gravity
    friction = db.Column(db.Float, default=0.1)
    restitution = db.Column(db.Float, default=0.5)  # Bounce factor
    linear_damping = db.Column(db.Float, default=0.1)  # Slows linear movement
    angular_damping = db.Column(db.Float, default=0.1)  # Slows rotation
    time_scale = db.Column(db.Float, default=1.0)  # Physics simulation speed
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id'), nullable=True)
    scene_id = db.Column(db.Integer, db.ForeignKey('scenes.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    universe = db.relationship('Universe', back_populates='physics_2d')
    scene = db.relationship('Scene', back_populates='physics_2d')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'gravity_x': self.gravity_x,
            'gravity_y': self.gravity_y,
            'friction': self.friction,
            'restitution': self.restitution,
            'linear_damping': self.linear_damping,
            'angular_damping': self.angular_damping,
            'time_scale': self.time_scale,
            'universe_id': self.universe_id,
            'scene_id': self.scene_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        } 