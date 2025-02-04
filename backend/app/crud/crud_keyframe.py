"""
CRUD operations for Keyframe model.
"""

from typing import Any, Dict, Optional, Union, List
from uuid import UUID
from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.visualization.keyframe import Keyframe, ParameterType
from app.schemas.keyframe import KeyframeCreate, KeyframeUpdate

class CRUDKeyframe(CRUDBase[Keyframe, KeyframeCreate, KeyframeUpdate]):
    def get_by_storyboard(
        self, db: Session, *, storyboard_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[Keyframe]:
        return (
            db.query(self.model)
            .filter(Keyframe.storyboard_id == storyboard_id)
            .order_by(Keyframe.time)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_parameter(
        self, db: Session, *, storyboard_id: UUID, parameter_type: ParameterType, parameter_id: UUID
    ) -> List[Keyframe]:
        return (
            db.query(self.model)
            .filter(
                Keyframe.storyboard_id == storyboard_id,
                Keyframe.parameter_type == parameter_type,
                Keyframe.parameter_id == parameter_id
            )
            .order_by(Keyframe.timestamp)
            .all()
        )

    def create_with_storyboard(
        self, db: Session, *, obj_in: KeyframeCreate, storyboard_id: UUID
    ) -> Keyframe:
        obj_in_data = obj_in.model_dump()
        db_obj = Keyframe(**obj_in_data, storyboard_id=storyboard_id)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_by_timestamp_range(
        self, db: Session, *, storyboard_id: UUID, start_time: float, end_time: float
    ) -> List[Keyframe]:
        return (
            db.query(self.model)
            .filter(
                Keyframe.storyboard_id == storyboard_id,
                Keyframe.timestamp >= start_time,
                Keyframe.timestamp <= end_time
            )
            .order_by(Keyframe.timestamp)
            .all()
        )

keyframe = CRUDKeyframe(Keyframe)
