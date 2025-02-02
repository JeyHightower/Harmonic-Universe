"""
Custom database types for SQLAlchemy.
"""

from sqlalchemy.types import TypeDecorator, String
from sqlalchemy.dialects.postgresql import UUID
import uuid

class GUID(TypeDecorator):
    """Platform-independent GUID type.

    Uses PostgreSQL's UUID type, otherwise uses String(32), storing as
    stringified hex values. SQLite doesn't support UUID natively, so we use
    String instead.
    """

    impl = String
    cache_ok = True

    def __init__(self, as_uuid=True):
        self.as_uuid = as_uuid
        super(GUID, self).__init__(length=32)

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
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
        if not isinstance(value, uuid.UUID):
            if len(value) == 32:  # For SQLite hex format
                value = uuid.UUID(hex=value)
            else:
                value = uuid.UUID(value)
        return value if self.as_uuid else str(value)
