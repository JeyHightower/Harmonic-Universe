"""Base model for all database models."""

from datetime import datetime
from app import db

class BaseModel(db.Model):
    """Base model class that includes common fields and methods."""
    __abstract__ = True

    id = db.Column(db.Integer, primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        """Convert model instance to dictionary."""
        return {
            'id': self.id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def save(self):
        """Save the model instance to the database."""
        db.session.add(self)
        db.session.commit()

    def delete(self):
        """Delete the model instance from the database."""
        db.session.delete(self)
        db.session.commit()
