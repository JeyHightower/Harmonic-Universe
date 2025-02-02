from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.ai_generation import AIGeneration, GenerationStatus
from app.models.ai_model import AIModelType
from app.schemas.ai_generation import AIGenerationCreate, AIGenerationUpdate

class CRUDAIGeneration(CRUDBase[AIGeneration, AIGenerationCreate, AIGenerationUpdate]):
    def get_by_universe(
        self, db: Session, *, universe_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[AIGeneration]:
        return (
            db.query(self.model)
            .filter(AIGeneration.universe_id == universe_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_model(
        self, db: Session, *, model_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[AIGeneration]:
        return (
            db.query(self.model)
            .filter(AIGeneration.model_id == model_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_status(
        self, db: Session, *, status: GenerationStatus, skip: int = 0, limit: int = 100
    ) -> List[AIGeneration]:
        return (
            db.query(self.model)
            .filter(AIGeneration.status == status)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_type(
        self, db: Session, *, generation_type: AIModelType, skip: int = 0, limit: int = 100
    ) -> List[AIGeneration]:
        return (
            db.query(self.model)
            .filter(AIGeneration.generation_type == generation_type)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_pending(
        self, db: Session, *, skip: int = 0, limit: int = 100
    ) -> List[AIGeneration]:
        return (
            db.query(self.model)
            .filter(AIGeneration.status == GenerationStatus.PENDING)
            .offset(skip)
            .limit(limit)
            .all()
        )

ai_generation = CRUDAIGeneration(AIGeneration)
