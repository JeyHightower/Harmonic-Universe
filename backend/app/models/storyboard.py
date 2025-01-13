from app.models import db
from datetime import datetime, UTC

class Storyboard(db.Model):
    __tablename__ = 'storyboards'

    id = db.Column(db.Integer, primary_key=True)
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id'), nullable=False)
    plot_point = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    harmony_tie = db.Column(db.Float, nullable=False, default=0.0)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))

    # Relationships
    universe = db.relationship('Universe', back_populates='storyboards')

    def to_dict(self):
        return {
            'id': self.id,
            'plot_point': self.plot_point,
            'description': self.description,
            'harmony_tie': self.harmony_tie,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f"<Storyboard {self.plot_point}>"
