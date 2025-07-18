from datetime import datetime
from sqlalchemy.sql import func
from .base import BaseModel
from ...extensions import db
from sqlalchemy.orm import relationship, Mapped, mapped_column
from typing import List, Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from .scene import Scene
    from .universe import Universe

# Association table for character-scene many-to-many relationship
character_scenes = db.Table(
    'character_scenes',
    db.Column('character_id', db.Integer, db.ForeignKey('characters.id', ondelete='CASCADE'), primary_key=True),
    db.Column('scene_id', db.Integer, db.ForeignKey('scenes.id', ondelete='CASCADE'), primary_key=True)
    # Removed columns that don't exist in the actual database schema
)

class Character(BaseModel):
    __tablename__ = 'characters'

    name: Mapped[str] = mapped_column(db.String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(db.Text)
    universe_id: Mapped[int] = mapped_column(db.Integer, db.ForeignKey('universes.id', ondelete='CASCADE'), nullable=False, index=True)

    # Relationships
    scenes: Mapped[List["Scene"]] = relationship('Scene', secondary=character_scenes, back_populates='characters', lazy=True)
    universe: Mapped["Universe"] = relationship('Universe', back_populates='characters')

    def __init__(self, name, universe_id, description=None):
        super().__init__()  # Added to properly initialize BaseModel
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
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'is_deleted': self.is_deleted
        }

    def __repr__(self):
        return f'<Character {self.name}>'
