"""
SQLAlchemy base model class.
"""

from typing import Any
from datetime import datetime
from sqlalchemy.ext.declarative import as_declarative, declared_attr
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import DateTime, MetaData, String
from sqlalchemy.types import TypeDecorator
import uuid

# Custom UUID type that works with both PostgreSQL and SQLite
class GUID(TypeDecorator):
    """Platform-independent GUID type.
    Uses PostgreSQL's UUID type, otherwise uses
    CHAR(32), storing as stringified hex values.
    """
    impl = String(32)
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            from sqlalchemy.dialects.postgresql import UUID
            return dialect.type_descriptor(UUID())
        else:
            return dialect.type_descriptor(String(32))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return str(value)
        else:
            if not isinstance(value, uuid.UUID):
                return "%.32x" % uuid.UUID(value).int
            else:
                return "%.32x" % value.int

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        else:
            if not isinstance(value, uuid.UUID):
                value = uuid.UUID(value)
            return value

# Recommended naming convention used by Alembic
NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s"
}

metadata = MetaData(naming_convention=NAMING_CONVENTION)

@as_declarative(metadata=metadata)
class Base:
    """Base class for all database models."""

    id: Mapped[uuid.UUID]
    created_at: Mapped[datetime]
    updated_at: Mapped[datetime]
    __name__: str

    # This will be used unless a model explicitly sets __tablename__
    @declared_attr
    def __tablename__(cls) -> str:
        """Generate table name automatically."""
        return cls.__name__.lower() + 's'

    # Common columns that all models should have
    id = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    created_at = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    @classmethod
    def get_by_id(cls, id: Any) -> Any:
        """Get a record by ID."""
        from app.db.session import db
        return db.session.query(cls).filter(cls.id == id).first()

    def save(self) -> None:
        """Save the current instance."""
        from app.db.session import db
        db.session.add(self)
        db.session.commit()

    def delete(self) -> None:
        """Delete the current instance."""
        from app.db.session import db
        db.session.delete(self)
        db.session.commit()

    def update(self, **kwargs) -> None:
        """Update the current instance."""
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
        self.save()

    @classmethod
    def create(cls, **kwargs) -> Any:
        """Create a new instance."""
        instance = cls(**kwargs)
        instance.save()
        return instance

    def dict(self):
        """Convert model to dictionary."""
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}
