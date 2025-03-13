"""Scene model."""
from sqlalchemy import (
    Column,
    String,
    Text,
    ForeignKey,
    Boolean,
    Integer,
    DateTime,
    Float,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..base import BaseModel


class Scene(BaseModel):
    """
    Scene model - represents a scene within a universe.
    Each scene can have its own physics and harmony parameters.
    """

    __tablename__ = "scenes"

    # Basic information
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    image_url = Column(String(1024), nullable=True)

    # Positioning/ordering
    order = Column(Integer, default=0)  # Order within universe

    # Universe relationship
    universe_id = Column(
        Integer, ForeignKey("universes.id", ondelete="CASCADE"), nullable=False
    )
    universe = relationship("Universe", back_populates="scenes")

    # Scene type
    scene_type = Column(
        String(50), default="standard"
    )  # standard, cinematic, interactive, etc.

    # Parameters for visualization and physics
    physics_parameters = Column(JSONB, default=dict)
    harmony_parameters = Column(JSONB, default=dict)
    visualization_settings = Column(JSONB, default=dict)

    # State tracking
    is_active = Column(Boolean, default=True)
    is_complete = Column(Boolean, default=False)

    # Additional scene-specific parameters
    duration = Column(Float, default=60.0)  # Duration in seconds
    tempo = Column(Float, default=120.0)  # Music tempo in BPM

    # Foreign Keys
    creator_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    # Scene-specific parameter overrides
    physics_overrides = Column(
        JSONB,
        default=lambda: {
            "enabled": False,
            "parameters": {},  # Override specific physics parameters from universe
        },
    )

    harmony_overrides = Column(
        JSONB,
        default=lambda: {
            "enabled": False,
            "parameters": {},  # Override specific harmony parameters from universe
        },
    )

    # Scene-specific AI settings
    ai_settings = Column(
        JSONB,
        default=lambda: {
            "enabled": True,
            "behavior": {
                "auto_adjust": True,
                "learning_rate": 0.001,
                "target_metrics": ["harmony", "physics_stability"],
            },
            "constraints": {"min_performance": 0.5, "max_complexity": 0.8},
        },
    )

    # Timeline and animation settings
    timeline_settings = Column(
        JSONB,
        default=lambda: {
            "duration": 60.0,  # seconds
            "fps": 60,
            "keyframes": [],
            "loops": False,
            "markers": [],
        },
    )

    # Relationships
    creator = relationship("User", back_populates="scenes")
    physics_objects = relationship(
        "PhysicsObject", back_populates="scene", cascade="all, delete-orphan"
    )
    physics_constraints = relationship(
        "PhysicsConstraint", back_populates="scene", cascade="all, delete-orphan"
    )
    audio_tracks = relationship(
        "AudioTrack", back_populates="scene", cascade="all, delete-orphan"
    )
    visualizations = relationship(
        "Visualization", back_populates="scene", cascade="all, delete-orphan"
    )

    def to_dict(self):
        """Convert scene object to dictionary"""
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "image_url": self.image_url,
            "order": self.order,
            "universe_id": self.universe_id,
            "scene_type": self.scene_type,
            "physics_parameters": self.physics_parameters,
            "harmony_parameters": self.harmony_parameters,
            "visualization_settings": self.visualization_settings,
            "is_active": self.is_active,
            "is_complete": self.is_complete,
            "duration": self.duration,
            "tempo": self.tempo,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def to_dict_with_relationships(self):
        """
        Convert scene object to dictionary including universe name
        and other important relationship information
        """
        scene_dict = self.to_dict()
        if self.universe:
            scene_dict["universe_name"] = self.universe.name
        return scene_dict
