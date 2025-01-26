"""Base CRUD service module."""
from typing import Any, Dict, List, Optional, Type, TypeVar
from app.extensions import db
from sqlalchemy.exc import SQLAlchemyError

T = TypeVar("T")


class CRUDBase:
    """Base class for CRUD operations."""

    def __init__(self, model: Type[T]):
        self.model = model

    def create(self, data: Dict[str, Any]) -> Optional[T]:
        """Create a new record."""
        try:
            instance = self.model(**data)
            db.session.add(instance)
            db.session.commit()
            return instance
        except SQLAlchemyError:
            db.session.rollback()
            raise

    def get(self, id: int) -> Optional[T]:
        """Get a record by ID."""
        return self.model.query.get(id)

    def get_all(self) -> List[T]:
        """Get all records."""
        return self.model.query.all()

    def update(self, id: int, data: Dict[str, Any]) -> Optional[T]:
        """Update a record."""
        try:
            instance = self.get(id)
            if instance:
                for key, value in data.items():
                    setattr(instance, key, value)
                db.session.commit()
            return instance
        except SQLAlchemyError:
            db.session.rollback()
            raise

    def delete(self, id: int) -> bool:
        """Delete a record."""
        try:
            instance = self.get(id)
            if instance:
                db.session.delete(instance)
                db.session.commit()
                return True
            return False
        except SQLAlchemyError:
            db.session.rollback()
            raise
