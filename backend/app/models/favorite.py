from ..extensions import db
from sqlalchemy.orm import relationship
from datetime import datetime

class Favorite(db.Model):
    __tablename__ = 'favorites'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship('User', back_populates='favorites',
                       overlaps="favorite_universes,favorited_by")
    universe = relationship('Universe', back_populates='favorites',
                          overlaps="favorite_universes,favorited_by")

    def __repr__(self):
        return f'<Favorite {self.user_id} -> {self.universe_id}>'

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'universe_id': self.universe_id,
            'created_at': self.created_at.isoformat()
        }
