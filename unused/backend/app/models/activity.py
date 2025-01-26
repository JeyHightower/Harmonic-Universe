from datetime import datetime
from app.models.base import BaseModel
from app.extensions import db

class Activity(BaseModel):
    """Model for tracking user activities in universes"""

    __tablename__ = 'activities'

    id = db.Column(db.Integer, primary_key=True)
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    action = db.Column(db.String(50), nullable=False)  # e.g. 'created', 'updated', 'deleted'
    target = db.Column(db.String(50), nullable=False)  # e.g. 'universe', 'parameter', 'storyboard'
    details = db.Column(db.JSON)  # Additional details about the activity
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    universe = db.relationship('Universe', backref=db.backref('activities', lazy=True))
    user = db.relationship('User', backref=db.backref('activities', lazy=True))

    def __init__(self, universe_id, user_id, action, target, details=None):
        """Initialize a new activity record"""
        self.universe_id = universe_id
        self.user_id = user_id
        self.action = action
        self.target = target
        self.details = details or {}

    def to_dict(self):
        """Convert activity to dictionary"""
        return {
            'id': self.id,
            'universeId': self.universe_id,
            'userId': self.user_id,
            'username': self.user.username,
            'action': self.action,
            'target': self.target,
            'details': self.details,
            'timestamp': self.timestamp.isoformat()
        }

    def __repr__(self):
        """String representation of activity"""
        return f'<Activity {self.action} {self.target} by User {self.user_id} in Universe {self.universe_id}>'
