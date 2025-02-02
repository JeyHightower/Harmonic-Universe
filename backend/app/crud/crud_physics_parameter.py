from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.physics_parameter import PhysicsParameter
from app.schemas.physics_parameter import PhysicsParameterCreate, PhysicsParameterUpdate

class CRUDPhysicsParameter(CRUDBase[PhysicsParameter, PhysicsParameterCreate, PhysicsParameterUpdate]):
    def get_by_universe(
        self, db: Session, *, universe_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[PhysicsParameter]:
        return (
            db.query(self.model)
            .filter(PhysicsParameter.universe_id == universe_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def create_with_universe(
        self, db: Session, *, obj_in: PhysicsParameterCreate, universe_id: UUID
    ) -> PhysicsParameter:
        obj_in_data = obj_in.model_dump()
        db_obj = PhysicsParameter(**obj_in_data, universe_id=universe_id)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_by_name(
        self, db: Session, *, universe_id: UUID, name: str
    ) -> Optional[PhysicsParameter]:
        return (
            db.query(self.model)
            .filter(
                PhysicsParameter.universe_id == universe_id,
                PhysicsParameter.name == name
            )
            .first()
        )

physics_parameter = CRUDPhysicsParameter(PhysicsParameter)
