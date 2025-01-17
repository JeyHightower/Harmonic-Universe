from datetime import datetime
from app.extensions import db

class Storyboard(db.Model):
    """Model for storing storyboard entries."""
    __tablename__ = 'storyboards'

    id = db.Column(db.Integer, primary_key=True)
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id', ondelete='CASCADE'), nullable=False)
    plot_point = db.Column(db.String(500), nullable=False)
    description = db.Column(db.Text)
    harmony_tie = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    universe = db.relationship('Universe', back_populates='storyboards')
    versions = db.relationship('Version', back_populates='storyboard', cascade='all, delete-orphan')

    def __repr__(self):
        return f'<Storyboard {self.id} for Universe {self.universe_id}>'

    def to_dict(self):
        """Convert storyboard to dictionary."""
        return {
            'id': self.id,
            'universe_id': self.universe_id,
            'plot_point': self.plot_point,
            'description': self.description,
            'harmony_tie': self.harmony_tie,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
