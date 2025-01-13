from app.extensions import db
from datetime import datetime, UTC

class Universe(db.Model):
    __tablename__ = 'universes'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    gravity_constant = db.Column(db.Float)
    environment_harmony = db.Column(db.Float)
    creator_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))

    # Relationships
    user = db.relationship('User', back_populates='universes')
    music_parameters = db.relationship('MusicParameter', back_populates='universe', cascade='all, delete')
    physics_parameters = db.relationship('PhysicsParameter', back_populates='universe', cascade='all, delete')
    storyboards = db.relationship('Storyboard', back_populates='universe', cascade='all, delete')

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
