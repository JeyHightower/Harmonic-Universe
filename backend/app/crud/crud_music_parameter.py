from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.music_parameter import MusicParameter
from app.schemas.music_parameter import MusicParameterCreate, MusicParameterUpdate

class CRUDMusicParameter(CRUDBase[MusicParameter, MusicParameterCreate, MusicParameterUpdate]):
    def get_by_universe(
        self, db: Session, *, universe_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[MusicParameter]:
        return (
            db.query(self.model)
            .filter(MusicParameter.universe_id == universe_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def create_with_universe(
        self, db: Session, *, obj_in: MusicParameterCreate, universe_id: UUID
    ) -> MusicParameter:
        obj_in_data = obj_in.model_dump()
        db_obj = MusicParameter(**obj_in_data, universe_id=universe_id)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_by_name(
        self, db: Session, *, universe_id: UUID, name: str
    ) -> Optional[MusicParameter]:
        return (
            db.query(self.model)
            .filter(
                MusicParameter.universe_id == universe_id,
                MusicParameter.name == name
            )
            .first()
        )

music_parameter = CRUDMusicParameter(MusicParameter)
