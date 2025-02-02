from typing import Optional, Dict
from pydantic import BaseModel, UUID4
from datetime import datetime
from app.models.ai_model import AIModelType
from app.models.ai_generation import GenerationStatus

class AIGenerationBase(BaseModel):
    generation_type: AIModelType
    input_data: Dict
    output_data: Optional[Dict] = None
    error_message: Optional[str] = None
    is_approved: bool = False
    generation_metadata: Dict = {}

class AIGenerationCreate(AIGenerationBase):
    model_id: UUID4
    universe_id: UUID4

class AIGenerationUpdate(AIGenerationBase):
    generation_type: Optional[AIModelType] = None
    input_data: Optional[Dict] = None
    output_data: Optional[Dict] = None
    error_message: Optional[str] = None
    is_approved: Optional[bool] = None
    generation_metadata: Optional[Dict] = None

class AIGenerationInDBBase(AIGenerationBase):
    id: UUID4
    model_id: UUID4
    universe_id: UUID4
    status: GenerationStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AIGeneration(AIGenerationInDBBase):
    pass

class AIGenerationWithDetails(AIGeneration):
    # Add additional fields for detailed view
    model_name: Optional[str] = None
    model_provider: Optional[str] = None
    processing_time: Optional[float] = None
    resource_usage: Optional[Dict] = None
    related_generations: Optional[list[Dict]] = []
