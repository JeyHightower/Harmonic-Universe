from datetime import datetime
from ..database import db
from .base import BaseModel

class MusicalTheme(BaseModel):
    __tablename__ = 'musical_themes'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    file_path = db.Column(db.String(255))
    character_id = db.Column(db.Integer, db.ForeignKey('characters.id'), nullable=True)
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id'), nullable=True)
    key = db.Column(db.String(20))  # Musical key
    tempo = db.Column(db.Integer)   # BPM
    mood = db.Column(db.String(50)) # Mood/emotion of the theme
    
    # Relationships
    character = db.relationship('Character', backref=db.backref('musical_themes', lazy=True))
    universe = db.relationship('Universe', backref=db.backref('musical_themes', lazy=True))
    
    def to_dict(self):
        base_dict = super().to_dict()
        base_dict.update({
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'file_path': self.file_path,
            'character_id': self.character_id,
            'universe_id': self.universe_id,
            'key': self.key,
            'tempo': self.tempo,
            'mood': self.mood
        })
        return base_dict 