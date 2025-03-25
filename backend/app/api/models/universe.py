from app import db
from datetime import datetime

class Universe(db.Model):
    __tablename__ = 'universes'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    creator_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    sound_profile_id = db.Column(db.Integer, db.ForeignKey('sound_profiles.id'), nullable=True)
    is_2d = db.Column(db.Boolean, default=True)  # Whether this universe uses 2D or 3D physics
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    creator = db.relationship('User', back_populates='universes')
    characters = db.relationship('Character', back_populates='universe', lazy=True, cascade='all, delete-orphan')
    scenes = db.relationship('Scene', back_populates='universe', lazy=True, cascade='all, delete-orphan')
    notes = db.relationship('Note', back_populates='universe', lazy=True, cascade='all, delete-orphan')
    sound_profile = db.relationship('SoundProfile', back_populates='universes')
    musical_themes = db.relationship('MusicalTheme', back_populates='universe', lazy=True)
    physics_2d = db.relationship('Physics2D', back_populates='universe', uselist=False)
    physics_3d = db.relationship('Physics3D', back_populates='universe', uselist=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'creator_id': self.creator_id,
            'sound_profile_id': self.sound_profile_id,
            'is_2d': self.is_2d,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        } 