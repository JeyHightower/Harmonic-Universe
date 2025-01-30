"""Base model definitions.

This module provides base classes and mixins for SQLAlchemy models,
including a base model class and timestamp functionality.
"""
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime
from sqlalchemy.orm import Mapped
from ..extensions import db


class BaseModel(db.Model):
    """Abstract base model class.

    This class serves as the base for all database models in the application.
    """
    __abstract__ = True


class TimestampMixin:
    """Mixin for adding timestamp columns to models.

    Provides created_at and updated_at columns that are automatically managed.
    """
    created_at: Mapped[datetime] = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

