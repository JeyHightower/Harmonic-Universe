from app import db
from datetime import datetime

class PhysicsObject(db.Model):
    __tablename__ = 'physics_objects'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    object_type = db.Column(db.String(50), nullable=False)  # box, sphere, cylinder, etc.
    is_static = db.Column(db.Boolean, default=False)  # Whether object is immovable
    is_2d = db.Column(db.Boolean, default=True)      # Whether this is a 2D or 3D object
    
    # Position
    position_x = db.Column(db.Float, default=0.0)
    position_y = db.Column(db.Float, default=0.0)
    position_z = db.Column(db.Float, default=0.0)
    
    # Rotation (Euler angles in degrees)
    rotation_x = db.Column(db.Float, default=0.0)
    rotation_y = db.Column(db.Float, default=0.0)
    rotation_z = db.Column(db.Float, default=0.0)
    
    # Scale
    scale_x = db.Column(db.Float, default=1.0)
    scale_y = db.Column(db.Float, default=1.0)
    scale_z = db.Column(db.Float, default=1.0)
    
    # Physics properties
    mass = db.Column(db.Float, default=1.0)
    friction = db.Column(db.Float, default=0.3)
    restitution = db.Column(db.Float, default=0.5)
    linear_damping = db.Column(db.Float, default=0.05)
    angular_damping = db.Column(db.Float, default=0.05)
    
    # Collision properties
    collision_group = db.Column(db.Integer, default=1)
    collision_mask = db.Column(db.Integer, default=1)
    
    # Foreign keys
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id'), nullable=True)
    scene_id = db.Column(db.Integer, db.ForeignKey('scenes.id'), nullable=True)
    character_id = db.Column(db.Integer, db.ForeignKey('characters.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    universe = db.relationship('Universe', backref=db.backref('physics_objects', lazy=True))
    scene = db.relationship('Scene', backref=db.backref('physics_objects', lazy=True))
    character = db.relationship('Character', backref=db.backref('physics_objects', lazy=True))
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'object_type': self.object_type,
            'is_static': self.is_static,
            'is_2d': self.is_2d,
            'position': {
                'x': self.position_x,
                'y': self.position_y,
                'z': self.position_z
            },
            'rotation': {
                'x': self.rotation_x,
                'y': self.rotation_y,
                'z': self.rotation_z
            },
            'scale': {
                'x': self.scale_x,
                'y': self.scale_y,
                'z': self.scale_z
            },
            'mass': self.mass,
            'friction': self.friction,
            'restitution': self.restitution,
            'linear_damping': self.linear_damping,
            'angular_damping': self.angular_damping,
            'collision_group': self.collision_group,
            'collision_mask': self.collision_mask,
            'universe_id': self.universe_id,
            'scene_id': self.scene_id,
            'character_id': self.character_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        } 