from datetime import datetime
from app import db
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
    scene_id = db.Column(db.Integer, db.ForeignKey('scenes.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_deleted = db.Column(db.Boolean, default=False)

    # Relationships
    scene = db.relationship('Scene', backref=db.backref('characters', lazy=True))

    def __init__(self, name, scene_id, description=None):
        self.name = name
        self.scene_id = scene_id
        self.description = description

    def validate(self):
        """Validate character data"""
        if not self.name or not self.name.strip():
            raise ValueError("Character name cannot be empty")
        if len(self.name) > 100:
            raise ValueError("Character name cannot exceed 100 characters")
        if not self.scene_id:
            raise ValueError("Character must belong to a scene")

    def to_dict(self):
        """Convert character to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'scene_id': self.scene_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def __repr__(self):
        return f'<Character {self.name}>' 