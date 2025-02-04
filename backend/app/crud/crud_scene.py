"""
CRUD operations for Scene model.
"""

from typing import List, Optional, Dict, Any, Union
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.crud.base import CRUDBase
from app.models.scene import Scene
from app.schemas.scene import SceneCreate, SceneUpdate

class CRUDScene(CRUDBase[Scene, SceneCreate, SceneUpdate]):
    def get_by_universe(
        self, db: Session, *, universe_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[Scene]:
        return (
            db.query(self.model)
            .filter(Scene.universe_id == universe_id)
            .order_by(Scene.position)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_creator(
        self, db: Session, *, creator_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[Scene]:
        return (
            db.query(self.model)
            .filter(Scene.creator_id == creator_id)
            .order_by(desc(Scene.created_at))
            .offset(skip)
            .limit(limit)
            .all()
        )

    def create_with_creator(
        self, db: Session, *, obj_in: SceneCreate, creator_id: UUID
    ) -> Scene:
        obj_in_data = obj_in.model_dump()
        db_obj = Scene(**obj_in_data, creator_id=creator_id)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def reorder_scenes(
        self, db: Session, *, universe_id: UUID, scene_order: List[UUID]
    ) -> List[Scene]:
        scenes = []
        for position, scene_id in enumerate(scene_order):
            scene = (
                db.query(self.model)
                .filter(Scene.id == scene_id, Scene.universe_id == universe_id)
                .first()
            )
            if scene:
                scene.position = position
                scenes.append(scene)
        db.commit()
        return scenes

scene = CRUDScene(Scene)
