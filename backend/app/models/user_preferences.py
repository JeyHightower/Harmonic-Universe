from datetime import datetime
from sqlalchemy.dialects.postgresql import JSONB
from app.extensions import db

class UserPreferences(db.Model):
    __tablename__ = 'user_preferences'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    theme = db.Column(db.String(20), default='system')  # system, light, dark
    notifications_enabled = db.Column(db.Boolean, default=True)
    notification_types = db.Column(JSONB, default={
        'system': True,
        'alert': True,
        'message': True
    })
    email_notifications = db.Column(db.Boolean, default=True)
    push_notifications = db.Column(db.Boolean, default=True)
    language = db.Column(db.String(10), default='en')
    timezone = db.Column(db.String(50), default='UTC')
    date_format = db.Column(db.String(20), default='YYYY-MM-DD')
    time_format = db.Column(db.String(20), default='HH:mm')
    accessibility = db.Column(JSONB, default={
        'high_contrast': False,
        'reduced_motion': False,
        'font_size': 'medium'
    })
    dashboard_layout = db.Column(JSONB, default={
        'widgets': ['notifications', 'analytics', 'recent_activity'],
        'layout': 'grid'
    })
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __init__(self, user_id: int, **kwargs):
        self.user_id = user_id
        for key, value in kwargs.items():
            setattr(self, key, value)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'theme': self.theme,
            'notifications_enabled': self.notifications_enabled,
            'notification_types': self.notification_types,
            'email_notifications': self.email_notifications,
            'push_notifications': self.push_notifications,
            'language': self.language,
            'timezone': self.timezone,
            'date_format': self.date_format,
            'time_format': self.time_format,
            'accessibility': self.accessibility,
            'dashboard_layout': self.dashboard_layout,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

    def update(self, **kwargs):
        """Update user preferences."""
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
        self.updated_at = datetime.utcnow()

    def __repr__(self):
        return f'<UserPreferences {self.id} {self.user_id}>'
