"""Base model definitions."""
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime
from ..extensions import db

class BaseModel(db.Model):
    """Abstract base model class."""
    __abstract__ = True

class TimestampMixin:
    """Mixin for adding timestamp columns."""
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

