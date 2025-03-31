from datetime import datetime
from app import db
from app.api.models.base import BaseModel

class Scene(BaseModel):
    __tablename__ = 'scenes'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_deleted = db.Column(db.Boolean, default=False)

    # Relationships
    universe = db.relationship('Universe', backref=db.backref('scenes', lazy=True))
    characters = db.relationship('Character', backref='scene', lazy=True)
    notes = db.relationship('Note', backref='scene', lazy=True)

    def __init__(self, name, universe_id, description=None):
        self.name = name
        self.universe_id = universe_id
        self.description = description

    def validate(self):
        """Validate scene data"""
        if not self.name or not self.name.strip():
            raise ValueError("Scene name cannot be empty")
        if len(self.name) > 100:
            raise ValueError("Scene name cannot exceed 100 characters")
        if not self.universe_id:
            raise ValueError("Scene must belong to a universe")

    def to_dict(self):
        """Convert scene to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'universe_id': self.universe_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'characters': [character.to_dict() for character in self.characters] if self.characters else [],
            'notes': [note.to_dict() for note in self.notes] if self.notes else []
        }

    def __repr__(self):
        return f'<Scene {self.name}>' 