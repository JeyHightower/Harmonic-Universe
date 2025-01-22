from datetime import datetime
from app.extensions import db

class Notification(db.Model):
    """Notification model for user notifications."""
    __tablename__ = 'notifications'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(100), nullable=False)
    message = db.Column(db.String(500), nullable=False)
    type = db.Column(db.String(50), nullable=False)  # e.g., 'universe_update', 'comment', etc.
    read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = db.relationship('User', backref=db.backref('notifications', lazy=True))

    def __init__(self, user_id, title, message, type):
        """Initialize a new notification."""
        self.user_id = user_id
        self.title = title
        self.message = message
        self.type = type

    def to_dict(self):
        """Convert notification to dictionary."""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'message': self.message,
            'type': self.type,
            'read': self.read,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

    def mark_as_read(self):
        """Mark the notification as read."""
        self.read = True
        self.updated_at = datetime.utcnow()
        db.session.commit()

    def __repr__(self):
        """String representation of the notification."""
        return f'<Notification {self.id}: {self.title}>'
