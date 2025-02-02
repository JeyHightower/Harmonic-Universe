from typing import Optional, Dict
from pydantic import BaseModel, UUID4
from datetime import datetime
from app.models.ai_model import AIModelType

class AIModelBase(BaseModel):
    name: str
    model_type: AIModelType
    provider: str
    configuration: Dict = {}
    api_key: Optional[str] = None
    parameters: Dict = {}
    model_metadata: Dict = {}

class AIModelCreate(AIModelBase):
    pass

class AIModelUpdate(AIModelBase):
    name: Optional[str] = None
    model_type: Optional[AIModelType] = None
    provider: Optional[str] = None
    configuration: Optional[Dict] = None
    api_key: Optional[str] = None
    parameters: Optional[Dict] = None
    model_metadata: Optional[Dict] = None

class AIModelInDBBase(AIModelBase):
    id: UUID4
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AIModel(AIModelInDBBase):
    pass

class AIModelWithDetails(AIModel):
    # Add additional fields for detailed view
    generations_count: Optional[int] = 0
    success_rate: Optional[float] = 0.0
    average_processing_time: Optional[float] = None
    usage_stats: Optional[Dict] = None
    performance_metrics: Optional[Dict] = None
    last_used: Optional[datetime] = None
