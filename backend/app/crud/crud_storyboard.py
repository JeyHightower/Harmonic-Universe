"""
CRUD operations for Storyboard model.
"""

from typing import Any, Dict, Optional, Union, List
from uuid import UUID
from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.organization.storyboard import Storyboard
from app.schemas.storyboard import StoryboardCreate, StoryboardUpdate

class CRUDStoryboard(CRUDBase[Storyboard, StoryboardCreate, StoryboardUpdate]):
    def get_by_scene(
        self, db: Session, *, scene_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[Storyboard]:
        return (
            db.query(self.model)
            .filter(Storyboard.scene_id == scene_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def create_with_scene(
        self, db: Session, *, obj_in: StoryboardCreate, scene_id: UUID
    ) -> Storyboard:
        obj_in_data = obj_in.model_dump()
        db_obj = Storyboard(**obj_in_data, scene_id=scene_id)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_by_universe(
        self, db: Session, *, universe_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[Storyboard]:
        return (
            db.query(self.model)
            .filter(Storyboard.universe_id == universe_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def create_with_universe(
        self, db: Session, *, obj_in: StoryboardCreate, universe_id: UUID
    ) -> Storyboard:
        obj_in_data = obj_in.model_dump()
        db_obj = Storyboard(**obj_in_data, universe_id=universe_id)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_by_name(
        self, db: Session, *, universe_id: UUID, name: str
    ) -> Optional[Storyboard]:
        return (
            db.query(self.model)
            .filter(
                Storyboard.universe_id == universe_id,
                Storyboard.name == name
            )
            .first()
        )

storyboard = CRUDStoryboard(Storyboard)
