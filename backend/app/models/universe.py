from app.extensions import db
from datetime import datetime

class Universe(db.Model):
    __tablename__ = 'universes'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    gravity_constant = db.Column(db.Float)
    environment_harmony = db.Column(db.Float)
    creator_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        """Convert universe to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'gravity_constant': self.gravity_constant,
            'environment_harmony': self.environment_harmony,
            'creator_id': self.creator_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
