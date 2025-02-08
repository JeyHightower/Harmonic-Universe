"""
Base schemas with common validation patterns.
"""

from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field, validator

class TimestampedModel(BaseModel):
    """Base model with timestamp fields."""
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    @validator("updated_at", pre=True, always=True)
    def default_updated_at(cls, v: datetime, values: Dict[str, Any]) -> datetime:
        """Set updated_at to current time on update."""
        return datetime.utcnow()

class IDModel(BaseModel):
    """Base model with ID field."""
    id: int = Field(..., gt=0)

class NameDescriptionModel(BaseModel):
    """Base model with name and description fields."""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)

class MetadataModel(BaseModel):
    """Base model with metadata field."""
    metadata: Dict[str, Any] = Field(default_factory=dict)

class BaseAppModel(TimestampedModel, IDModel):
    """Base model for all application models."""
    class Config:
        from_attributes = True
        validate_assignment = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class BaseResponseModel(BaseModel):
    """Base model for all response models."""
    success: bool = Field(True)
    message: Optional[str] = None
    data: Optional[Dict[str, Any]] = None

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class PaginationParams(BaseModel):
    """Common pagination parameters."""
    page: int = Field(1, gt=0)
    per_page: int = Field(10, gt=0, le=100)
    sort_by: Optional[str] = None
    sort_order: Optional[str] = Field(None, pattern="^(asc|desc)$")

class ErrorResponseModel(BaseModel):
    """Standard error response model."""
    success: bool = Field(False)
    error: Dict[str, Any]
    message: str

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
