from app import db
from datetime import datetime

class Note(db.Model):
    __tablename__ = 'notes'

    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    character_id = db.Column(db.Integer, db.ForeignKey('characters.id'), nullable=True)
    universe_id = db.Column(db.Integer, nullable=True)
    scene_id = db.Column(db.Integer, nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = db.relationship('User', back_populates='notes')
    character = db.relationship('Character', back_populates='notes')

    def to_dict(self):
        return {
            'id': self.id,
            'content': self.content,
            'character_id': self.character_id,
            'universe_id': self.universe_id,
            'scene_id': self.scene_id,
            'user_id': self.user_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        } 