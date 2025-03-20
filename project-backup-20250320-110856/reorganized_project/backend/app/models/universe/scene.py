from datetime import datetime
from app.app import db

class Scene(db.Model):
    __tablename__ = 'scenes'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id'), nullable=False)
    creator_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    thumbnail_url = db.Column(db.String(255))
    position = db.Column(db.Integer, default=0)  # For ordering scenes within a universe
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    universe = db.relationship('Universe', back_populates='scenes')
    creator = db.relationship('User', back_populates='scenes')
    physics_objects = db.relationship('PhysicsObject', back_populates='scene', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'universe_id': self.universe_id,
            'creator_id': self.creator_id,
            'thumbnail_url': self.thumbnail_url,
            'position': self.position,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'object_count': len(self.physics_objects) if self.physics_objects else 0
        }
        
    def to_dict_with_objects(self):
        scene_dict = self.to_dict()
        scene_dict['physics_objects'] = [obj.to_dict() for obj in self.physics_objects]
        return scene_dict
