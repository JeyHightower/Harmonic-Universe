"""Base model for all database models."""

from datetime import datetime
import uuid
from sqlalchemy import Column, DateTime
from sqlalchemy.dialects.postgresql import UUID
from backend.app.db.base_class import Base

class BaseModel(Base):
    """Base model class that includes common fields and methods."""
    __abstract__ = True

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        """Convert model instance to dictionary."""
        return {
            'id': str(self.id),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def save(self, db_session):
        """Save the model instance to the database."""
        db_session.add(self)
        db_session.commit()

    def delete(self, db_session):
        """Delete the model instance from the database."""
        db_session.delete(self)
        db_session.commit()
