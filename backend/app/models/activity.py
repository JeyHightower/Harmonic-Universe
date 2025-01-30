from datetime import datetime
from app import db

class Activity(db.Model):
    __tablename__ = 'activities'

    id = db.Column(db.Integer, primary_key=True)
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id', ondelete='CASCADE'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    action = db.Column(db.String(100), nullable=False)
    target = db.Column(db.String(100), nullable=False)
    details = db.Column(db.JSON)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    universe = db.relationship('Universe', backref=db.backref('activities', lazy=True))
    user = db.relationship('User', backref=db.backref('activities', lazy=True))

    def save(self):
        db.session.add(self)
        db.session.commit()

    def to_dict(self):
        return {
            'id': self.id,
            'universe_id': self.universe_id,
            'user_id': self.user_id,
            'username': self.user.username,
            'action': self.action,
            'target': self.target,
            'details': self.details,
            'timestamp': self.timestamp.isoformat()
        }
