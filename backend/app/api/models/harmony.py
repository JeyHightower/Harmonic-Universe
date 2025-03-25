from app import db
from datetime import datetime

class Harmony(db.Model):
    __tablename__ = 'harmonies'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    progression = db.Column(db.String(255))  # Chord progression (e.g., "C-Am-F-G")
    key = db.Column(db.String(20))  # Musical key (e.g., C Major, A Minor)
    creator_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    music_piece_id = db.Column(db.Integer, db.ForeignKey('music_pieces.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    creator = db.relationship('User', back_populates='harmonies')
    music_piece = db.relationship('MusicPiece', back_populates='harmonies')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'progression': self.progression,
            'key': self.key,
            'creator_id': self.creator_id,
            'music_piece_id': self.music_piece_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        } 