from .. import db
from .base import BaseModel

class Note(BaseModel):
    __tablename__ = 'notes'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    content = db.Column(db.Text)
    
    # Foreign keys
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    character_id = db.Column(db.Integer, db.ForeignKey('characters.id'))
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id'))
    scene_id = db.Column(db.Integer, db.ForeignKey('scenes.id'))
    
    # Relationships
    user = db.relationship('User', backref=db.backref('notes', lazy=True))
    character = db.relationship('Character', backref=db.backref('notes', lazy=True))
    universe = db.relationship('Universe', backref=db.backref('notes', lazy=True))
    scene = db.relationship('Scene', backref=db.backref('notes', lazy=True))
    
    def to_dict(self):
        base_dict = super().to_dict()
        base_dict.update({
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'user_id': self.user_id,
            'character_id': self.character_id,
            'universe_id': self.universe_id,
            'scene_id': self.scene_id
        })
        return base_dict 