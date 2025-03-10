"""Mixins for SQLAlchemy models."""
from sqlalchemy import Column, DateTime
from sqlalchemy.sql import func

class TimestampMixin:
    """Mixin that adds created_at and updated_at columns to a model."""
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)
