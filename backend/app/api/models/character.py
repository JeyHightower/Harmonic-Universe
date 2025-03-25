from app import db
from datetime import datetime

class Character(db.Model):
    __tablename__ = 'characters'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id'), nullable=False)
    has_physics = db.Column(db.Boolean, default=False)  # Whether this character has physics properties
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    universe = db.relationship('Universe', back_populates='characters')
    notes = db.relationship('Note', back_populates='character', lazy=True, cascade='all, delete-orphan')
    scenes = db.relationship('Scene', secondary='character_scenes', back_populates='characters')
    musical_themes = db.relationship('MusicalTheme', back_populates='character', lazy=True, cascade='all, delete-orphan')
    # physics_objects relationship is defined in the PhysicsObject model

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'universe_id': self.universe_id,
            'has_physics': self.has_physics,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'notes': [note.to_dict() for note in self.notes]
        } 