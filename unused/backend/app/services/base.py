from typing import Any, Dict, List, Optional, Type, TypeVar
from app.extensions import db
from sqlalchemy.exc import SQLAlchemyError

T = TypeVar("T")


class BaseService:
    """Base service class with common CRUD operations."""

    def __init__(self, model: Type[T]):
        self.model = model

    def create(self, data: Dict[str, Any]) -> Optional[T]:
        """Create a new record."""
        try:
            instance = self.model(**data)
            db.session.add(instance)
            db.session.commit()
            return instance
        except SQLAlchemyError as e:
            db.session.rollback()
            raise e

    def get_by_id(self, id: int) -> Optional[T]:
        """Get a record by ID."""
        return self.model.query.get(id)

    def get_all(self) -> List[T]:
        """Get all records."""
        return self.model.query.all()

    def update(self, id: int, data: Dict[str, Any]) -> Optional[T]:
        """Update a record."""
        try:
            instance = self.get_by_id(id)
            if instance:
                for key, value in data.items():
                    setattr(instance, key, value)
                db.session.commit()
            return instance
        except SQLAlchemyError as e:
            db.session.rollback()
            raise e

    def delete(self, id: int) -> bool:
        """Delete a record."""
        try:
            instance = self.get_by_id(id)
            if instance:
                db.session.delete(instance)
                db.session.commit()
                return True
            return False
        except SQLAlchemyError as e:
            db.session.rollback()
            raise e

    def exists(self, **kwargs) -> bool:
        """Check if a record exists."""
        return db.session.query(
            db.session.query(self.model).filter_by(**kwargs).exists()
        ).scalar()

    def get_by_filter(self, **kwargs) -> List[T]:
        """Get records by filter criteria."""
        return self.model.query.filter_by(**kwargs).all()

    def get_one_by_filter(self, **kwargs) -> Optional[T]:
        """Get one record by filter criteria."""
        return self.model.query.filter_by(**kwargs).first()
