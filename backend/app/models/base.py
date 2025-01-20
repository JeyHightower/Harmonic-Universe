from datetime import datetime
from app.extensions import db

class BaseModel(db.Model):
    """Base model class that includes common fields and methods."""

    __abstract__ = True

    id = db.Column(db.Integer, primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __init__(self, **kwargs):
        """Initialize model with optional parameters."""
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)

    def save(self):
        """Save the model instance."""
        db.session.add(self)
        db.session.commit()
        return self

    def delete(self):
        """Delete the model instance."""
        db.session.delete(self)
        db.session.commit()

    def update(self, **kwargs):
        """Update model instance with given parameters."""
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
        self.save()
        return self
