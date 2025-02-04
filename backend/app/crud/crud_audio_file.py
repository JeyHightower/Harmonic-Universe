"""
CRUD operations for AudioFile model.
"""

from typing import Any, Dict, Optional, Union, List
from uuid import UUID
from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.audio_file import AudioFile, AudioFormat, AudioType
from app.schemas.audio_file import AudioFileCreate, AudioFileUpdate

class CRUDAudioFile(CRUDBase[AudioFile, AudioFileCreate, AudioFileUpdate]):
    def get_by_universe(
        self, db: Session, *, universe_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[AudioFile]:
        return (
            db.query(self.model)
            .filter(AudioFile.universe_id == universe_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_generation(
        self, db: Session, *, generation_id: UUID
    ) -> List[AudioFile]:
        return (
            db.query(self.model)
            .filter(AudioFile.generation_id == generation_id)
            .all()
        )

    def get_by_format(
        self, db: Session, *, format: AudioFormat, skip: int = 0, limit: int = 100
    ) -> List[AudioFile]:
        return (
            db.query(self.model)
            .filter(AudioFile.format == format)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_type(
        self, db: Session, *, type: AudioType, skip: int = 0, limit: int = 100
    ) -> List[AudioFile]:
        return (
            db.query(self.model)
            .filter(AudioFile.type == type)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_name(
        self, db: Session, *, universe_id: UUID, name: str
    ) -> Optional[AudioFile]:
        return (
            db.query(self.model)
            .filter(
                AudioFile.universe_id == universe_id,
                AudioFile.name == name
            )
            .first()
        )

    def get_by_scene(
        self, db: Session, *, scene_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[AudioFile]:
        return (
            db.query(self.model)
            .filter(AudioFile.scene_id == scene_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def create_with_scene(
        self, db: Session, *, obj_in: AudioFileCreate, scene_id: UUID
    ) -> AudioFile:
        obj_in_data = obj_in.model_dump()
        db_obj = AudioFile(**obj_in_data, scene_id=scene_id)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

audio_file = CRUDAudioFile(AudioFile)
