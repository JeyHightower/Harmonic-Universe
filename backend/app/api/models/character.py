from datetime import datetime
from ..database import db
from .base import BaseModel

class Character(BaseModel):
    __tablename__ = 'characters'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id'), nullable=False)
    has_physics = db.Column(db.Boolean, default=False)  # Whether this character has physics properties
    
    # Relationships
    universe = db.relationship('Universe', backref=db.backref('characters', lazy=True))
    notes = db.relationship('Note', backref='character', lazy=True)
    scenes = db.relationship('Scene', secondary='character_scenes', backref=db.backref('characters', lazy=True))
    musical_themes = db.relationship('MusicalTheme', back_populates='character', lazy=True, cascade='all, delete-orphan')
    # physics_objects relationship is defined in the PhysicsObject model

    def to_dict(self):
        base_dict = super().to_dict()
        base_dict.update({
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'universe_id': self.universe_id,
            'has_physics': self.has_physics,
            'notes': [note.to_dict() for note in self.notes]
        })
        return base_dict 