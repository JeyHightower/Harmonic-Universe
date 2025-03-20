"""Database utility functions."""

from typing import Any, Dict, List, Optional, Type, TypeVar, Union
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import text
from datetime import datetime

from app.db.base import Base

ModelType = TypeVar("ModelType", bound=Base)

def create_db_item(db: Session, model: Type[ModelType], **kwargs) -> Optional[ModelType]:
    """Create a database item."""
    try:
        db_item = model(**kwargs)
        db.add(db_item)
        db.commit()
        db.refresh(db_item)
        return db_item
    except SQLAlchemyError:
        db.rollback()
        return None

def update_db_item(db: Session, model: Type[ModelType], id: Any, **kwargs) -> Optional[ModelType]:
    """Update a database item."""
    try:
        db_item = db.query(model).filter(model.id == id).first()
        if not db_item:
            return None

        for key, value in kwargs.items():
            setattr(db_item, key, value)

        db.commit()
        db.refresh(db_item)
        return db_item
    except SQLAlchemyError:
        db.rollback()
        return None

def delete_db_item(db: Session, model: Type[ModelType], id: Any) -> bool:
    """Delete a database item."""
    try:
        db_item = db.query(model).filter(model.id == id).first()
        if not db_item:
            return False

        db.delete(db_item)
        db.commit()
        return True
    except SQLAlchemyError:
        db.rollback()
        return False

def get_db_item(db: Session, model: Type[ModelType], id: Any) -> Optional[ModelType]:
    """Get a database item by ID."""
    try:
        return db.query(model).filter(model.id == id).first()
    except SQLAlchemyError:
        return None

def get_db_items(db: Session, model: Type[ModelType], skip: int = 0, limit: int = 100) -> List[ModelType]:
    """Get multiple database items with pagination."""
    try:
        return db.query(model).offset(skip).limit(limit).all()
    except SQLAlchemyError:
        return []

def get_db_items_by_field(db: Session, model: Type[ModelType], field: str, value: Any) -> List[ModelType]:
    """Get database items by field value."""
    try:
        return db.query(model).filter(getattr(model, field) == value).all()
    except SQLAlchemyError:
        return []

def execute_raw_sql(db: Session, sql: str, params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """Execute raw SQL query."""
    try:
        result = db.execute(text(sql), params or {})
        return [dict(row) for row in result]
    except SQLAlchemyError:
        return []

def bulk_create_db_items(db: Session, model: Type[ModelType], items: List[Dict[str, Any]]) -> List[ModelType]:
    """Bulk create database items."""
    try:
        db_items = [model(**item) for item in items]
        db.bulk_save_objects(db_items)
        db.commit()
        return db_items
    except SQLAlchemyError:
        db.rollback()
        return []

def bulk_update_db_items(db: Session, model: Type[ModelType], items: List[Dict[str, Any]], id_field: str = 'id') -> bool:
    """Bulk update database items."""
    try:
        for item in items:
            id_value = item.pop(id_field)
            db.query(model).filter(getattr(model, id_field) == id_value).update(item)
        db.commit()
        return True
    except SQLAlchemyError:
        db.rollback()
        return False

def get_or_create_db_item(db: Session, model: Type[ModelType], defaults: Optional[Dict[str, Any]] = None,
                         **kwargs) -> tuple[ModelType, bool]:
    """Get an existing db item, or create it if it doesn't exist."""
    try:
        instance = db.query(model).filter_by(**kwargs).first()
        if instance:
            return instance, False

        params = dict(kwargs)
        if defaults:
            params.update(defaults)

        instance = model(**params)
        db.add(instance)
        db.commit()
        db.refresh(instance)
        return instance, True
    except SQLAlchemyError:
        db.rollback()
        return None, False

def soft_delete_db_item(db: Session, model: Type[ModelType], id: Any) -> bool:
    """Soft delete a database item by setting deleted_at timestamp."""
    try:
        db_item = db.query(model).filter(model.id == id).first()
        if not db_item:
            return False

        db_item.deleted_at = datetime.utcnow()
        db.commit()
        return True
    except SQLAlchemyError:
        db.rollback()
        return False

def restore_soft_deleted_item(db: Session, model: Type[ModelType], id: Any) -> bool:
    """Restore a soft-deleted database item."""
    try:
        db_item = db.query(model).filter(model.id == id).first()
        if not db_item:
            return False

        db_item.deleted_at = None
        db.commit()
        return True
    except SQLAlchemyError:
        db.rollback()
        return False
