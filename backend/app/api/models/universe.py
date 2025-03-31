from .base import BaseModel
from ..models.database import db

class Universe(BaseModel):
    __tablename__ = 'universes'
    
    name = db.Column(db.String(100), nullable=False, index=True)
    description = db.Column(db.Text)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    sound_profile_id = db.Column(db.Integer, db.ForeignKey('sound_profiles.id', ondelete='SET NULL'), index=True)
    is_public = db.Column(db.Boolean, nullable=False, default=False)
    
    # Relationships
    scenes = db.relationship('Scene', backref='universe', lazy=True, cascade='all, delete-orphan')
    notes = db.relationship('Note', backref='universe', lazy=True, cascade='all, delete-orphan')
    characters = db.relationship('Character', backref='universe', lazy=True, cascade='all, delete-orphan')
    physics_objects = db.relationship('PhysicsObject', backref='universe', lazy=True, cascade='all, delete-orphan')
    physics_2d = db.relationship('Physics2D', backref='universe', lazy=True, cascade='all, delete-orphan')
    physics_3d = db.relationship('Physics3D', backref='universe', lazy=True, cascade='all, delete-orphan')
    audio_samples = db.relationship('AudioSample', backref='universe', lazy=True, cascade='all, delete-orphan')
    music_pieces = db.relationship('MusicPiece', backref='universe', lazy=True, cascade='all, delete-orphan')
    sound_profile = db.relationship('SoundProfile', foreign_keys=[sound_profile_id], backref=db.backref('parent_universe', uselist=False), uselist=False, lazy=True)
    
    def validate(self):
        """Validate universe data."""
        if not self.name:
            raise ValueError("Universe name is required")
        if not self.user_id:
            raise ValueError("User ID is required")
            
    def to_dict(self):
        """Convert universe to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'user_id': self.user_id,
            'sound_profile_id': self.sound_profile_id,
            'is_public': self.is_public,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'is_deleted': self.is_deleted,
            'scenes_count': len(self.scenes),
            'characters_count': len(self.characters),
            'notes_count': len(self.notes)
        }

class Scene(BaseModel):
    __tablename__ = 'scenes'
    
    name = db.Column(db.String(100), nullable=False, index=True)
    description = db.Column(db.Text)
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id', ondelete='CASCADE'), nullable=False, index=True)
    sound_profile_id = db.Column(db.Integer, db.ForeignKey('sound_profiles.id', ondelete='SET NULL'), index=True)
    
    # Relationships
    notes = db.relationship('Note', backref='scene', lazy=True, cascade='all, delete-orphan')
    characters = db.relationship('Character', secondary='character_scenes', backref='scenes', lazy=True)
    physics_objects = db.relationship('PhysicsObject', backref='scene', lazy=True, cascade='all, delete-orphan')
    physics_2d = db.relationship('Physics2D', backref='scene', lazy=True, cascade='all, delete-orphan')
    physics_3d = db.relationship('Physics3D', backref='scene', lazy=True, cascade='all, delete-orphan')
    audio_samples = db.relationship('AudioSample', backref='scene', lazy=True, cascade='all, delete-orphan')
    music_pieces = db.relationship('MusicPiece', backref='scene', lazy=True, cascade='all, delete-orphan')
    
    def validate(self):
        """Validate scene data."""
        if not self.name:
            raise ValueError("Scene name is required")
        if not self.universe_id:
            raise ValueError("Universe ID is required")
            
    def to_dict(self):
        """Convert scene to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'universe_id': self.universe_id,
            'sound_profile_id': self.sound_profile_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'is_deleted': self.is_deleted,
            'characters_count': len(self.characters),
            'notes_count': len(self.notes)
        } 