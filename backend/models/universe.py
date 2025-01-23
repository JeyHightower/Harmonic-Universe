from app import db
from datetime import datetime

class Universe(db.Model):
    __tablename__ = 'universes'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    is_public = db.Column(db.Boolean, default=False)
    allow_guests = db.Column(db.Boolean, default=False)
    physics_enabled = db.Column(db.Boolean, default=True)
    music_enabled = db.Column(db.Boolean, default=True)
    creator_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    creator = db.relationship('User', backref=db.backref('universes', lazy=True))

    def __repr__(self):
        return f'<Universe {self.name}>'

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'is_public': self.is_public,
            'allow_guests': self.allow_guests,
            'physics_enabled': self.physics_enabled,
            'music_enabled': self.music_enabled,
            'creator_id': self.creator_id,
            'creator': self.creator.username,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
