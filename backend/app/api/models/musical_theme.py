from app import db
from datetime import datetime

class MusicalTheme(db.Model):
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
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    character = db.relationship('Character', back_populates='musical_themes')
    universe = db.relationship('Universe', back_populates='musical_themes')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'file_path': self.file_path,
            'character_id': self.character_id,
            'universe_id': self.universe_id,
            'key': self.key,
            'tempo': self.tempo,
            'mood': self.mood,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        } 