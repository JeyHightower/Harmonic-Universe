from datetime import datetime
from app.app import db
import json

class PhysicsObject(db.Model):
    __tablename__ = 'physics_objects'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    object_type = db.Column(db.String(50), nullable=False)
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id'), nullable=False)
    scene_id = db.Column(db.Integer, db.ForeignKey('scenes.id'))
    
    # Physical properties stored as JSON
    position = db.Column(db.Text, default='{"x": 0, "y": 0, "z": 0}')
    rotation = db.Column(db.Text, default='{"x": 0, "y": 0, "z": 0}')
    scale = db.Column(db.Text, default='{"x": 1, "y": 1, "z": 1}')
    mass = db.Column(db.Float, default=1.0)
    is_static = db.Column(db.Boolean, default=False)
    
    # Appearance properties
    color = db.Column(db.String(20), default='#FFFFFF')
    model_url = db.Column(db.String(255))
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    universe = db.relationship('Universe', back_populates='physics_objects')
    scene = db.relationship('Scene', back_populates='physics_objects')
    parameters = db.relationship('PhysicsParameter', back_populates='physics_object', cascade='all, delete-orphan')
    
    @property
    def position_dict(self):
        return json.loads(self.position)
        
    @position_dict.setter
    def position_dict(self, position_dict):
        self.position = json.dumps(position_dict)
    
    @property
    def rotation_dict(self):
        return json.loads(self.rotation)
        
    @rotation_dict.setter
    def rotation_dict(self, rotation_dict):
        self.rotation = json.dumps(rotation_dict)
    
    @property
    def scale_dict(self):
        return json.loads(self.scale)
        
    @scale_dict.setter
    def scale_dict(self, scale_dict):
        self.scale = json.dumps(scale_dict)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'object_type': self.object_type,
            'universe_id': self.universe_id,
            'scene_id': self.scene_id,
            'position': self.position_dict,
            'rotation': self.rotation_dict,
            'scale': self.scale_dict,
            'mass': self.mass,
            'is_static': self.is_static,
            'color': self.color,
            'model_url': self.model_url,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
        
    def to_dict_with_parameters(self):
        object_dict = self.to_dict()
        object_dict['parameters'] = [param.to_dict() for param in self.parameters]
        return object_dict