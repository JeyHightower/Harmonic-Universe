from datetime import datetime
from app.extensions import db
from app.api.models.base import BaseModel

# Association table for character-scene many-to-many relationship
character_scenes = db.Table('character_scenes',
    db.Column('character_id', db.Integer, db.ForeignKey('characters.id', ondelete='CASCADE'), primary_key=True),
    db.Column('scene_id', db.Integer, db.ForeignKey('scenes.id', ondelete='CASCADE'), primary_key=True)
)

class Character(BaseModel):
    __tablename__ = 'characters'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id', ondelete='CASCADE'), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_deleted = db.Column(db.Boolean, default=False)

    # Relationships
    scenes = db.relationship('Scene', secondary=character_scenes, lazy=True)

    def __init__(self, name, universe_id, description=None):
        self.name = name
        self.universe_id = universe_id
        self.description = description

    def validate(self):
        """Validate character data"""
        if not self.name or not self.name.strip():
            raise ValueError("Character name cannot be empty")
        if len(self.name) > 100:
            raise ValueError("Character name cannot exceed 100 characters")
        if not self.universe_id:
            raise ValueError("Universe ID is required")

    def to_dict(self):
        """Convert character to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'universe_id': self.universe_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def __repr__(self):
        return f'<Character {self.name}>' 