from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.ai_model import AIModel, AIModelType
from app.schemas.ai_model import AIModelCreate, AIModelUpdate

class CRUDAIModel(CRUDBase[AIModel, AIModelCreate, AIModelUpdate]):
    def get_by_type(
        self, db: Session, *, model_type: AIModelType
    ) -> List[AIModel]:
        return (
            db.query(self.model)
            .filter(AIModel.model_type == model_type)
            .all()
        )

    def get_by_provider(
        self, db: Session, *, provider: str
    ) -> List[AIModel]:
        return (
            db.query(self.model)
            .filter(AIModel.provider == provider)
            .all()
        )

    def get_by_name(
        self, db: Session, *, name: str
    ) -> Optional[AIModel]:
        return (
            db.query(self.model)
            .filter(AIModel.name == name)
            .first()
        )

ai_model = CRUDAIModel(AIModel)
