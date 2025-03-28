from ..database import db
from .base import BaseModel

class Universe(BaseModel):
    __tablename__ = 'universes'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, index=True)
    description = db.Column(db.Text)
    creator_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    sound_profile_id = db.Column(db.Integer, db.ForeignKey('sound_profiles.id', ondelete='SET NULL'), nullable=True, index=True)
    is_2d = db.Column(db.Boolean, default=True, index=True)  # Whether this universe uses 2D or 3D physics
    
    # Relationships with cascade delete
    creator = db.relationship('User', backref=db.backref('universes', lazy=True))
    characters = db.relationship('Character', backref=db.backref('universe', lazy=True), cascade='all, delete-orphan')
    scenes = db.relationship('Scene', backref=db.backref('universe', lazy=True), cascade='all, delete-orphan')
    notes = db.relationship('Note', backref=db.backref('universe', lazy=True), cascade='all, delete-orphan')
    sound_profile = db.relationship('SoundProfile', backref=db.backref('universes', lazy=True))
    musical_themes = db.relationship('MusicalTheme', backref=db.backref('universe', lazy=True), cascade='all, delete-orphan')
    physics_2d = db.relationship('Physics2D', backref=db.backref('universe', uselist=False), cascade='all, delete-orphan')
    physics_3d = db.relationship('Physics3D', backref=db.backref('universe', uselist=False), cascade='all, delete-orphan')
    
    def to_dict(self):
        base_dict = super().to_dict()
        base_dict.update({
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'creator_id': self.creator_id,
            'sound_profile_id': self.sound_profile_id,
            'is_2d': self.is_2d,
            'characters': [character.to_dict() for character in self.characters],
            'scenes': [scene.to_dict() for scene in self.scenes],
            'notes': [note.to_dict() for note in self.notes]
        })
        return base_dict 