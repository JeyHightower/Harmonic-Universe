"""
CRUD operations for Universe model.
"""

from typing import List, Optional, Dict, Any, Union
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.crud.base import CRUDBase
from app.models.core.universe import Universe
from app.schemas.universe import UniverseCreate, UniverseUpdate

class CRUDUniverse(CRUDBase[Universe, UniverseCreate, UniverseUpdate]):
    def get_by_owner(
        self, db: Session, *, owner_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[Universe]:
        return (
            db.query(self.model)
            .filter(Universe.owner_id == owner_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_accessible_universes(
        self, db: Session, *, user_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[Universe]:
        return (
            db.query(self.model)
            .filter(
                or_(
                    Universe.owner_id == user_id,
                    Universe.is_public == True,
                    Universe.collaborators.contains([str(user_id)])
                )
            )
            .offset(skip)
            .limit(limit)
            .all()
        )

    def create_with_owner(
        self, db: Session, *, obj_in: UniverseCreate, owner_id: UUID
    ) -> Universe:
        obj_in_data = obj_in.model_dump()
        obj_in_data['physics_parameters'] = obj_in_data.get('physics_parameters', [])
        obj_in_data['music_parameters'] = obj_in_data.get('music_parameters', [])
        db_obj = Universe(**obj_in_data, creator_id=owner_id)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def is_owner_or_collaborator(
        self, db: Session, *, universe_id: UUID, user_id: UUID
    ) -> bool:
        universe = self.get(db=db, id=universe_id)
        if not universe:
            return False
        return (
            universe.owner_id == user_id
            or str(user_id) in universe.collaborators
            or universe.is_public
        )

universe = CRUDUniverse(Universe)
