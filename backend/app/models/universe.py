from datetime import datetime
from app.extensions import db

class Universe(db.Model):
    __tablename__ = 'universes'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    gravity_constant = db.Column(db.Float, nullable=False)
    environment_harmony = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)

    # Relationships
    creator = db.relationship('User', back_populates='universes')
    storyboards = db.relationship('Storyboard', back_populates='universe', cascade='all, delete-orphan')
    music_parameters = db.relationship('MusicParameter', back_populates='universe', cascade='all, delete-orphan')
    physics_parameters = db.relationship('PhysicsParameter', back_populates='universe', cascade='all, delete-orphan')

    def __repr__(self):
        return f'<Universe {self.name}>'

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'gravity_constant': self.gravity_constant,
            'environment_harmony': self.environment_harmony,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'created_by': self.created_by
        }
