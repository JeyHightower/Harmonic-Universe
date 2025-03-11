"""SQLAlchemy base class module."""

from sqlalchemy.ext.declarative import as_declarative, declared_attr


@as_declarative()
class Base:
    """Base class for all database models."""

    # Generate __tablename__ automatically
    @declared_attr
    def __tablename__(cls) -> str:
        """Generate table name automatically."""
        return cls.__name__.lower()

    def to_dict(self):
        """Convert model instance to dictionary."""
        return {
            "id": self.id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def save(self, db_session):
        """Save the model instance to the database."""
        db_session.add(self)
        db_session.commit()

    def delete(self, db_session):
        """Delete the model instance from the database."""
        db_session.delete(self)
        db_session.commit()
