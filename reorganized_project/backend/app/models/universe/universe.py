from datetime import datetime
from app.app import db

class Universe(db.Model):
    __tablename__ = 'universes'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    creator_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    is_public = db.Column(db.Boolean, default=False)
    thumbnail_url = db.Column(db.String(255))
    physics_rules = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    creator = db.relationship('User', back_populates='universes')
    scenes = db.relationship('Scene', back_populates='universe', cascade='all, delete-orphan')
    physics_objects = db.relationship('PhysicsObject', back_populates='universe', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'creator_id': self.creator_id,
            'is_public': self.is_public,
            'thumbnail_url': self.thumbnail_url,
            'physics_rules': self.physics_rules,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'scene_count': len(self.scenes) if self.scenes else 0
        }
        
    def to_dict_with_scenes(self):
        universe_dict = self.to_dict()
        universe_dict['scenes'] = [scene.to_dict() for scene in self.scenes]
        return universe_dict
