"""Base CRUD operations."""
from typing import Dict, List, Optional, Type, TypeVar
from app.extensions import db
from sqlalchemy.exc import SQLAlchemyError

T = TypeVar("T")


class CRUDBase:
    """Base class for CRUD operations."""

    def __init__(self, model: Type[T]):
        self.model = model

    def create(self, data: Dict) -> Optional[T]:
        try:
            obj = self.model(**data)
            db.session.add(obj)
            db.session.commit()
            return obj
        except SQLAlchemyError:
            db.session.rollback()
            raise

    def get(self, id: int) -> Optional[T]:
        return self.model.query.get(id)

    def get_multi(self) -> List[T]:
        return self.model.query.all()

    def update(self, id: int, data: Dict) -> Optional[T]:
        try:
            obj = self.get(id)
            if obj:
                for key, value in data.items():
                    setattr(obj, key, value)
                db.session.commit()
            return obj
        except SQLAlchemyError:
            db.session.rollback()
            raise

    def delete(self, id: int) -> bool:
        try:
            obj = self.get(id)
            if obj:
                db.session.delete(obj)
                db.session.commit()
                return True
            return False
        except SQLAlchemyError:
            db.session.rollback()
            raise
