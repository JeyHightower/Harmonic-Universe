from app.models import db
from datetime import datetime, UTC

class Template(db.Model):
    __tablename__ = 'templates'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    category = db.Column(db.String(100), nullable=False)
    physics_params = db.Column(db.JSON, nullable=False)
    music_params = db.Column(db.JSON, nullable=False)
    creator_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    is_public = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))

    # Relationships
    creator = db.relationship('User', back_populates='templates')
    universes = db.relationship('Universe', back_populates='template')

    def to_dict(self):
        """Convert template to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'category': self.category,
            'physics_params': self.physics_params,
            'music_params': self.music_params,
            'creator_id': self.creator_id,
            'creator': {
                'id': self.creator.id,
                'username': self.creator.username
            },
            'is_public': self.is_public,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def __repr__(self):
        return f"<Template {self.id}: {self.name}>"
