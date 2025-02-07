"""
AI model definitions.
"""

from sqlalchemy import Column, Integer, String, Float, JSON, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
import enum
from app.db.base_class import Base

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

class AIModel(Base):
    """AI model definition."""
    __tablename__ = "ai_models"

    id = Column(Integer, primary_key=True, index=True)
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
    created_by = Column(Integer, ForeignKey("users.id"))

    # Relationships
    training_sessions = relationship("TrainingSession", back_populates="model", cascade="all, delete-orphan")
    inference_results = relationship("InferenceResult", back_populates="model", cascade="all, delete-orphan")

    def __repr__(self):
        """String representation."""
        return f"<AIModel(id={self.id}, name='{self.name}', type='{self.model_type}')>"

class TrainingSession(Base):
    """Training session for an AI model."""
    __tablename__ = "training_sessions"

    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(Integer, ForeignKey("ai_models.id", ondelete="CASCADE"))
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

class InferenceResult(Base):
    """Results from model inference."""
    __tablename__ = "inference_results"

    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(Integer, ForeignKey("ai_models.id", ondelete="CASCADE"))
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

class Dataset(Base):
    """Training dataset for AI models."""
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    data_type = Column(String)  # audio, physics, etc.
    format = Column(String)  # file format or data structure
    size = Column(Integer)  # Size in bytes or number of samples
    features = Column(JSON, default=dict)  # Dataset features/schema
    metadata = Column(JSON, default=dict)  # Additional metadata
    file_path = Column(String)  # Path to dataset files
    created_by = Column(Integer, ForeignKey("users.id"))

    def __repr__(self):
        """String representation."""
        return f"<Dataset(id={self.id}, name='{self.name}', type='{self.data_type}')>"
