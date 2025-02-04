"""Base service layer."""

from typing import Any, Dict, Generic, List, Optional, Type, TypeVar, Union
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.base_class import Base
from app.repositories.base import BaseRepository

ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)


class BaseService(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    """Base class for all services."""

    def __init__(self, model: Type[ModelType], repository: BaseRepository):
        """Initialize service with model and repository."""
        self.model = model
        self.repository = repository

    def get(self, db: Session, id: Any) -> Optional[ModelType]:
        """Get a single record by ID."""
        return self.repository.get(db=db, id=id)

    def get_multi(
        self, db: Session, *, skip: int = 0, limit: int = 100
    ) -> List[ModelType]:
        """Get multiple records."""
        return self.repository.get_multi(db=db, skip=skip, limit=limit)

    def create(self, db: Session, *, obj_in: CreateSchemaType) -> ModelType:
        """Create a new record."""
        obj_in_data = jsonable_encoder(obj_in)
        return self.repository.create(db=db, obj_in=obj_in_data)

    def update(
        self,
        db: Session,
        *,
        db_obj: ModelType,
        obj_in: Union[UpdateSchemaType, Dict[str, Any]]
    ) -> ModelType:
        """Update a record."""
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)
        return self.repository.update(db=db, db_obj=db_obj, obj_in=update_data)

    def delete(self, db: Session, *, id: Any) -> ModelType:
        """Delete a record."""
        return self.repository.delete(db=db, id=id)

    def exists(self, db: Session, id: Any) -> bool:
        """Check if a record exists."""
        return self.repository.exists(db=db, id=id)

    def count(self, db: Session) -> int:
        """Get total count of records."""
        return self.repository.count(db=db)
