"""
Visualization models for data visualization and real-time updates.
"""

from sqlalchemy import Column, Integer, String, Float, JSON, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
import enum
from app.db.base_class import Base

class VisualizationType(str, enum.Enum):
    """Types of visualizations."""
    WAVEFORM = "waveform"
    SPECTRUM = "spectrum"
    SPECTROGRAM = "spectrogram"
    PHYSICS_3D = "physics_3d"
    PARTICLE_SYSTEM = "particle_system"
    CUSTOM = "custom"

class DataSource(str, enum.Enum):
    """Types of data sources."""
    AUDIO = "audio"
    PHYSICS = "physics"
    AI_MODEL = "ai_model"
    EXTERNAL = "external"
    CUSTOM = "custom"

class Visualization(Base):
    """Visualization configuration."""
    __tablename__ = "visualizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    visualization_type = Column(Enum(VisualizationType))
    data_source = Column(Enum(DataSource))
    source_id = Column(Integer)  # ID of the source object (audio track, physics simulation, etc.)
    settings = Column(JSON, default=dict)  # Visualization settings
    layout = Column(JSON, default=dict)  # Layout/positioning
    style = Column(JSON, default=dict)  # Visual style settings
    is_real_time = Column(Boolean, default=False)
    update_interval = Column(Float, nullable=True)  # For real-time updates
    created_by = Column(Integer, ForeignKey("users.id"))

    # Relationships
    data_mappings = relationship("DataMapping", back_populates="visualization", cascade="all, delete-orphan")
    snapshots = relationship("VisualizationSnapshot", back_populates="visualization", cascade="all, delete-orphan")

    def __repr__(self):
        """String representation."""
        return f"<Visualization(id={self.id}, name='{self.name}', type='{self.visualization_type}')>"

class DataMapping(Base):
    """Mapping between data and visual properties."""
    __tablename__ = "data_mappings"

    id = Column(Integer, primary_key=True, index=True)
    visualization_id = Column(Integer, ForeignKey("visualizations.id", ondelete="CASCADE"))
    data_field = Column(String)  # Source data field
    visual_property = Column(String)  # Target visual property
    mapping_type = Column(String)  # linear, logarithmic, categorical, etc.
    range_min = Column(Float, nullable=True)
    range_max = Column(Float, nullable=True)
    scale_factor = Column(Float, default=1.0)
    custom_mapping = Column(JSON, nullable=True)  # For custom mapping functions
    enabled = Column(Boolean, default=True)

    # Relationships
    visualization = relationship("Visualization", back_populates="data_mappings")

    def __repr__(self):
        """String representation."""
        return f"<DataMapping(id={self.id}, field='{self.data_field}', property='{self.visual_property}')>"

class VisualizationSnapshot(Base):
    """Snapshot of visualization state."""
    __tablename__ = "visualization_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    visualization_id = Column(Integer, ForeignKey("visualizations.id", ondelete="CASCADE"))
    timestamp = Column(Float)
    name = Column(String, nullable=True)
    description = Column(String, nullable=True)
    state_data = Column(JSON)  # Complete state of the visualization
    thumbnail_path = Column(String, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"))

    # Relationships
    visualization = relationship("Visualization", back_populates="snapshots")

    def __repr__(self):
        """String representation."""
        return f"<VisualizationSnapshot(id={self.id}, visualization_id={self.visualization_id})>"

class RealTimeStream(Base):
    """Configuration for real-time data streaming."""
    __tablename__ = "realtime_streams"

    id = Column(Integer, primary_key=True, index=True)
    visualization_id = Column(Integer, ForeignKey("visualizations.id", ondelete="CASCADE"))
    stream_type = Column(String)  # websocket, sse, etc.
    buffer_size = Column(Integer)  # Size of data buffer
    sample_rate = Column(Float)  # Data sampling rate
    is_active = Column(Boolean, default=False)
    connection_settings = Column(JSON, default=dict)
    processing_pipeline = Column(JSON, default=list)  # List of processing steps
    error_handling = Column(JSON, default=dict)

    def __repr__(self):
        """String representation."""
        return f"<RealTimeStream(id={self.id}, visualization_id={self.visualization_id}, type='{self.stream_type}')>"
