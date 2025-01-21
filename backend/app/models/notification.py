from datetime import datetime
from sqlalchemy.dialects.postgresql import JSONB
from app.extensions import db

class Notification(db.Model):
    __tablename__ = 'notifications'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    type = db.Column(db.String(50), nullable=False)
    message = db.Column(db.String(500), nullable=False)
    metadata = db.Column(JSONB, default={})
    read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    read_at = db.Column(db.DateTime, nullable=True)

    def __init__(self, user_id: int, type: str, message: str, metadata: dict = None):
        self.user_id = user_id
        self.type = type
        self.message = message
        self.metadata = metadata or {}

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'type': self.type,
            'message': self.message,
            'metadata': self.metadata,
            'read': self.read,
            'created_at': self.created_at.isoformat(),
            'read_at': self.read_at.isoformat() if self.read_at else None
        }

    def __repr__(self):
        return f'<Notification {self.id} {self.type}>'
