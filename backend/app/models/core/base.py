from datetime import datetime
import uuid
from app.db.session import Base
from sqlalchemy import Column, Integer, DateTime, String, Text, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

class BaseModel(Base):
    """Base model class that includes common fields and methods."""
    __abstract__ = True

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def save(self, session):
        """Save the model instance to the database."""
        session.add(self)
        session.commit()
        return self

    def delete(self, session):
        """Delete the model instance from the database."""
        session.delete(self)
        session.commit()

    def update(self, session, **kwargs):
        """Update the model instance with the given kwargs."""
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
        return self.save(session)

    @classmethod
    def get_by_id(cls, session, id):
        """Get a model instance by its ID."""
        return session.query(cls).get(id)

    @classmethod
    def get_all(cls, session):
        """Get all instances of the model."""
        return session.query(cls).all()

    def to_dict(self):
        """Convert the model instance to a dictionary."""
        return {
            'id': self.id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class NameDescriptionMixin:
    """Mixin that adds name and description fields."""
    name = Column(String(255), nullable=False)
    description = Column(Text)

class MetadataMixin:
    """Mixin that adds a metadata JSON field."""
    metadata = Column(JSON, default=dict)

class UserMixin:
    """Mixin that adds a user relationship."""
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    user = relationship('User')
