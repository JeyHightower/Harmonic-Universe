"""
AI model definitions.
"""

from sqlalchemy import Column, Integer, String, Float, JSON, ForeignKey, Enum, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum
from ..base import BaseModel

class ModelType(str, enum.Enum):
    """Types of AI models."""
    AUDIO_GENERATION = "audio_generation"
    AUDIO_ANALYSIS = "audio_analysis"
    PHYSICS_SIMULATION = "physics_simulation"
    VISUALIZATION = "visualization"
    CUSTOM = "custom"

class ModelStatus(str, enum.Enum):
    """Status of AI models."""
    INITIALIZING = "initializing"
    TRAINING = "training"
    READY = "ready"
    ERROR = "error"
    ARCHIVED = "archived"

class AIModel(BaseModel):
    """AI model definition."""
    __tablename__ = "ai_models"

    name = Column(String, index=True)
    description = Column(String, nullable=True)
    model_type = Column(Enum(ModelType))
    architecture = Column(String)  # e.g., "transformer", "cnn", etc.
    version = Column(String)
    status = Column(Enum(ModelStatus), default=ModelStatus.INITIALIZING)
    parameters = Column(JSON, default=dict)  # Model hyperparameters
    metrics = Column(JSON, default=dict)  # Training/validation metrics
    file_path = Column(String)  # Path to saved model
    is_public = Column(Boolean, default=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))

    # Relationships
    training_sessions = relationship("TrainingSession", back_populates="model", cascade="all, delete-orphan")
    inference_results = relationship("InferenceResult", back_populates="model", cascade="all, delete-orphan")
    user = relationship("User", back_populates="ai_models")

    def __repr__(self):
        """String representation."""
        return f"<AIModel(id={self.id}, name='{self.name}', type='{self.model_type}')>"

    def to_dict(self):
        """Convert to dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "model_type": self.model_type.value,
            "architecture": self.architecture,
            "version": self.version,
            "status": self.status.value,
            "parameters": self.parameters,
            "metrics": self.metrics,
            "file_path": self.file_path,
            "is_public": self.is_public,
            "created_by": self.created_by,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }

class TrainingSession(BaseModel):
    """Training session for an AI model."""
    __tablename__ = "training_sessions"

    model_id = Column(UUID(as_uuid=True), ForeignKey("ai_models.id", ondelete="CASCADE"))
    start_time = Column(Float)
    end_time = Column(Float, nullable=True)
    status = Column(String)  # "running", "completed", "failed"
    hyperparameters = Column(JSON, default=dict)
    metrics = Column(JSON, default=dict)
    validation_results = Column(JSON, default=dict)
    error_message = Column(String, nullable=True)

    # Relationships
    model = relationship("AIModel", back_populates="training_sessions")

    def __repr__(self):
        """String representation."""
        return f"<TrainingSession(id={self.id}, model_id={self.model_id}, status='{self.status}')>"

    def to_dict(self):
        """Convert to dictionary."""
        return {
            "id": self.id,
            "model_id": self.model_id,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "status": self.status,
            "hyperparameters": self.hyperparameters,
            "metrics": self.metrics,
            "validation_results": self.validation_results,
            "error_message": self.error_message,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }

class InferenceResult(BaseModel):
    """Results from model inference."""
    __tablename__ = "inference_results"

    model_id = Column(UUID(as_uuid=True), ForeignKey("ai_models.id", ondelete="CASCADE"))
    timestamp = Column(Float)
    input_data = Column(JSON)  # Input parameters/data
    output_data = Column(JSON)  # Model predictions/output
    metrics = Column(JSON, default=dict)  # Performance metrics
    processing_time = Column(Float)  # Time taken for inference

    # Relationships
    model = relationship("AIModel", back_populates="inference_results")

    def __repr__(self):
        """String representation."""
        return f"<InferenceResult(id={self.id}, model_id={self.model_id})>"

    def to_dict(self):
        """Convert to dictionary."""
        return {
            "id": self.id,
            "model_id": self.model_id,
            "timestamp": self.timestamp,
            "input_data": self.input_data,
            "output_data": self.output_data,
            "metrics": self.metrics,
            "processing_time": self.processing_time,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }

class Dataset(BaseModel):
    """Training dataset for AI models."""
    __tablename__ = "datasets"

    name = Column(String, index=True)
    description = Column(String, nullable=True)
    data_type = Column(String)  # audio, physics, etc.
    format = Column(String)  # file format or data structure
    size = Column(Float)  # Size in bytes or number of samples
    features = Column(JSON, default=dict)  # Dataset features/schema
    dataset_metadata = Column(JSON, default=dict)  # Additional metadata
    file_path = Column(String)  # Path to dataset files
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))

    def __repr__(self):
        """String representation."""
        return f"<Dataset(id={self.id}, name='{self.name}', type='{self.data_type}')>"

    def to_dict(self):
        """Convert to dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "data_type": self.data_type,
            "format": self.format,
            "size": self.size,
            "features": self.features,
            "dataset_metadata": self.dataset_metadata,
            "file_path": self.file_path,
            "created_by": self.created_by,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }
