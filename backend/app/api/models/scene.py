from app import db
from datetime import datetime

class Scene(db.Model):
    __tablename__ = 'scenes'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id'), nullable=False)
    music_piece_id = db.Column(db.Integer, db.ForeignKey('music_pieces.id'), nullable=True)
    is_2d = db.Column(db.Boolean, default=True)  # Whether this scene uses 2D or 3D physics
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    universe = db.relationship('Universe', back_populates='scenes')
    characters = db.relationship('Character', secondary='character_scenes', back_populates='scenes')
    notes = db.relationship('Note', back_populates='scene', lazy=True, cascade='all, delete-orphan')
    music_piece = db.relationship('MusicPiece', back_populates='scenes')
    physics_2d = db.relationship('Physics2D', back_populates='scene', uselist=False)
    physics_3d = db.relationship('Physics3D', back_populates='scene', uselist=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'universe_id': self.universe_id,
            'music_piece_id': self.music_piece_id,
            'is_2d': self.is_2d,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        } 