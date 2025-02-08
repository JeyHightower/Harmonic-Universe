from datetime import datetime
from app import db

class BaseModel(db.Model):
    """Base model class that includes common fields and methods."""
    __abstract__ = True

    id = db.Column(db.Integer, primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def save(self):
        """Save the model instance to the database."""
        db.session.add(self)
        db.session.commit()
        return self

    def delete(self):
        """Delete the model instance from the database."""
        db.session.delete(self)
        db.session.commit()

    def update(self, **kwargs):
        """Update the model instance with the given kwargs."""
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
        self.save()
        return self

    @classmethod
    def get_by_id(cls, id):
        """Get a model instance by its ID."""
        return cls.query.get(id)

    @classmethod
    def get_all(cls):
        """Get all instances of the model."""
        return cls.query.all()

    def to_dict(self):
        """Convert the model instance to a dictionary."""
        return {
            'id': self.id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class NameDescriptionMixin:
    """Mixin that adds name and description fields."""
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)

class MetadataMixin:
    """Mixin that adds a metadata JSON field."""
    metadata = db.Column(db.JSON, default=dict)

class UserMixin:
    """Mixin that adds a user relationship."""
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    user = db.relationship('User', back_populates='items')
