from app.models import db
from datetime import datetime, UTC

class Favorite(db.Model):
    __tablename__ = 'favorites'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC))

    # Relationships
    user = db.relationship('User', back_populates='favorites')
    universe = db.relationship('Universe', back_populates='favorites')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'universe_id': self.universe_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f"<Favorite {self.user_id} -> {self.universe_id}>"
