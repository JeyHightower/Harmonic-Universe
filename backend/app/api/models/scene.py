from .. import db
from .base import BaseModel

class Scene(BaseModel):
    __tablename__ = 'scenes'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    
    # Foreign keys
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id'), nullable=False)
    
    # Relationships
    universe = db.relationship('Universe', backref=db.backref('scenes', lazy=True))
    notes = db.relationship('Note', backref=db.backref('scene', lazy=True))
    characters = db.relationship('Character', secondary='character_scenes', backref=db.backref('scenes', lazy=True))
    
    def to_dict(self):
        base_dict = super().to_dict()
        base_dict.update({
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'universe_id': self.universe_id,
            'characters': [character.to_dict() for character in self.characters],
            'notes': [note.to_dict() for note in self.notes]
        })
        return base_dict 