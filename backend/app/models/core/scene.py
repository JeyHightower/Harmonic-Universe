"""Scene model."""

from typing import TYPE_CHECKING, Dict, Optional
from sqlalchemy import Column, String, Text, ForeignKey, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.models.core.base import BaseModel

if TYPE_CHECKING:
    from .user import User  # noqa: F401
    from .universe import Universe  # noqa: F401
    from ..physics.physics_parameter import PhysicsParameter  # noqa: F401
    from ..physics.physics_object import PhysicsObject  # noqa: F401
    from ..physics.physics_constraint import PhysicsConstraint  # noqa: F401
    from ..audio.audio_track import AudioTrack  # noqa: F401
    from ..audio.midi_sequence import MIDISequence  # noqa: F401

class Scene(BaseModel):
    """Scene model for managing individual scenes within a universe."""

    __tablename__ = "scenes"

    name = Column(String, nullable=False)
    description = Column(Text)
    order = Column(Integer, default=0)  # For scene ordering
    is_active = Column(Boolean, default=True)
    version = Column(Integer, default=1)

    # Foreign Keys
    universe_id = Column(UUID(as_uuid=True), ForeignKey("universes.id", ondelete="CASCADE"), nullable=False)
    creator_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Scene-specific parameter overrides
    physics_overrides = Column(JSONB, default=lambda: {
        'enabled': False,
        'parameters': {}  # Override specific physics parameters from universe
    })

    harmony_overrides = Column(JSONB, default=lambda: {
        'enabled': False,
        'parameters': {}  # Override specific harmony parameters from universe
    })

    # Scene-specific visualization settings
    visualization_settings = Column(JSONB, default=lambda: {
        'camera': {
            'position': {'x': 0, 'y': 5, 'z': 10},
            'target': {'x': 0, 'y': 0, 'z': 0},
            'fov': 75
        },
        'lighting': {
            'ambient': {'intensity': 0.5, 'color': '#ffffff'},
            'directional': {'intensity': 1.0, 'color': '#ffffff', 'position': {'x': 1, 'y': 1, 'z': 1}},
            'shadows': True
        },
        'post_processing': {
            'enabled': True,
            'bloom': {'enabled': True, 'intensity': 1.0},
            'ambient_occlusion': {'enabled': True, 'intensity': 1.0},
            'motion_blur': {'enabled': False, 'intensity': 0.5}
        },
        'background': {
            'type': 'gradient',
            'colors': ['#1a2b3c', '#3c2b1a']
        }
    })

    # Scene-specific AI settings
    ai_settings = Column(JSONB, default=lambda: {
        'enabled': True,
        'behavior': {
            'auto_adjust': True,
            'learning_rate': 0.001,
            'target_metrics': ['harmony', 'physics_stability']
        },
        'constraints': {
            'min_performance': 0.5,
            'max_complexity': 0.8
        }
    })

    # Timeline and animation settings
    timeline_settings = Column(JSONB, default=lambda: {
        'duration': 60.0,  # seconds
        'fps': 60,
        'keyframes': [],
        'loops': False,
        'markers': []
    })

    # Relationships
    universe = relationship("Universe", back_populates="scenes")
    creator = relationship("User", back_populates="scenes")
    physics_objects = relationship("PhysicsObject", back_populates="scene", cascade="all, delete-orphan")
    physics_constraints = relationship("PhysicsConstraint", back_populates="scene", cascade="all, delete-orphan")
    physics_parameters = relationship("PhysicsParameter", back_populates="scene", uselist=False, cascade="all, delete-orphan")
    audio_tracks = relationship("AudioTrack", back_populates="scene", cascade="all, delete-orphan")
    midi_sequences = relationship("MIDISequence", back_populates="scene", cascade="all, delete-orphan")

    # Ensure proper table creation order
    __table_args__ = {'extend_existing': True}

    def to_dict(self):
        """Convert to dictionary with all parameters."""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "order": self.order,
            "is_active": self.is_active,
            "version": self.version,
            "universe_id": self.universe_id,
            "creator_id": self.creator_id,
            "physics_overrides": self.physics_overrides,
            "harmony_overrides": self.harmony_overrides,
            "visualization_settings": self.visualization_settings,
            "ai_settings": self.ai_settings,
            "timeline_settings": self.timeline_settings,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }

    def update_physics_overrides(self, params: Dict) -> 'Scene':
        """Update physics parameter overrides."""
        if params.get('enabled') is not None:
            self.physics_overrides['enabled'] = params['enabled']
        if params.get('parameters'):
            self.physics_overrides['parameters'].update(params['parameters'])
        return self

    def update_harmony_overrides(self, params: Dict) -> 'Scene':
        """Update harmony parameter overrides."""
        if params.get('enabled') is not None:
            self.harmony_overrides['enabled'] = params['enabled']
        if params.get('parameters'):
            self.harmony_overrides['parameters'].update(params['parameters'])
        return self

    def update_visualization(self, params: Dict) -> 'Scene':
        """Update visualization settings."""
        for key, value in params.items():
            if key in self.visualization_settings:
                if isinstance(value, dict):
                    self.visualization_settings[key].update(value)
                else:
                    self.visualization_settings[key] = value
        return self

    def update_ai_settings(self, params: Dict) -> 'Scene':
        """Update AI settings."""
        for key, value in params.items():
            if key in self.ai_settings:
                if isinstance(value, dict):
                    self.ai_settings[key].update(value)
                else:
                    self.ai_settings[key] = value
        return self

    def update_timeline(self, params: Dict) -> 'Scene':
        """Update timeline settings."""
        self.timeline_settings.update(params)
        return self

    def get_effective_physics_params(self, universe_params: Dict) -> Dict:
        """Get effective physics parameters considering overrides."""
        if not self.physics_overrides['enabled']:
            return universe_params

        result = universe_params.copy()
        result.update(self.physics_overrides['parameters'])
        return result

    def get_effective_harmony_params(self, universe_params: Dict) -> Dict:
        """Get effective harmony parameters considering overrides."""
        if not self.harmony_overrides['enabled']:
            return universe_params

        result = universe_params.copy()
        result.update(self.harmony_overrides['parameters'])
        return result

    def __repr__(self) -> str:
        """String representation of Scene."""
        return f"<Scene {self.name} (v{self.version})>"
