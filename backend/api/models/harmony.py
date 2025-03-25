from datetime import datetime
from ..database import db
from .base import BaseModel

class Harmony(BaseModel):
    __tablename__ = 'harmonies'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    progression = db.Column(db.String(255))  # Chord progression (e.g., "C-Am-F-G")
    key = db.Column(db.String(20))  # Musical key (e.g., C Major, A Minor)
    creator_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    music_piece_id = db.Column(db.Integer, db.ForeignKey('music_pieces.id'), nullable=True)
    
    # Relationships
    creator = db.relationship('User', backref=db.backref('harmonies', lazy=True))
    music_piece = db.relationship('MusicPiece', backref=db.backref('harmonies', lazy=True))
    
    def to_dict(self):
        base_dict = super().to_dict()
        base_dict.update({
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'progression': self.progression,
            'key': self.key,
            'creator_id': self.creator_id,
            'music_piece_id': self.music_piece_id
        })
        return base_dict 