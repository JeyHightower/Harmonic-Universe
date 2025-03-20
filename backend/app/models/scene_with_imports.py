"""Scene model."""

from __future__ import annotations
from typing import TYPE_CHECKING, Any, Dict, List, Optional
from uuid import UUID

from sqlalchemy import String, Text, Boolean, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID

from ..base import BaseModel

if TYPE_CHECKING:
    from ..user import User
    from .universe import Universe
    from ..physics.physics_object import PhysicsObject
    from ..physics.physics_constraint import PhysicsConstraint
    from ..physics.physics_parameter import PhysicsParameter
    from ..audio.audio_track import AudioTrack
    from ..audio.midi_sequence import MIDISequence



class Scene(BaseModel):
    """Scene model for managing individual scenes within a universe."""

    __tablename__ = "scenes"

    # Basic fields
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    order: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    version: Mapped[int] = mapped_column(Integer, default=1)

    # Foreign Keys
    universe_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("universes.id", ondelete="CASCADE"),
        nullable=False
    )
    creator_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    # Scene-specific parameter overrides
    physics_overrides: Mapped[Dict[str, Any]] = mapped_column(
        JSONB,
        default=lambda: {
            'enabled': False,
            'parameters': {}
        }
    )

    harmony_overrides: Mapped[Dict[str, Any]] = mapped_column(
        JSONB,
        default=lambda: {
            'enabled': False,
            'parameters': {}
        }
    )

    # Scene-specific visualization settings
    visualization_settings: Mapped[Dict[str, Any]] = mapped_column(
        JSONB,
        default=lambda: {
            'camera': {
                'position': {'x': 0, 'y': 5, 'z': 10},
                'target': {'x': 0, 'y': 0, 'z': 0},
                'fov': 75
            },
            'lighting': {
                'ambient': {'intensity': 0.5, 'color': '#ffffff'},
                'directional': {
                    'intensity': 1.0,
                    'color': '#ffffff',
                    'position': {'x': 1, 'y': 1, 'z': 1}
                },
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
        }
    )

    # Scene-specific AI settings
    ai_settings: Mapped[Dict[str, Any]] = mapped_column(
        JSONB,
        default=lambda: {
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
        }
    )

    # Timeline and animation settings
    timeline_settings: Mapped[Dict[str, Any]] = mapped_column(
        JSONB,
        default=lambda: {
            'duration': 60.0,
            'fps': 60,
            'keyframes': [],
            'loops': False,
            'markers': []
        }
    )

    # Relationships
    universe: Mapped["Universe"] = relationship("Universe", back_populates="scenes")
    creator: Mapped["User"] = relationship("User", back_populates="scenes")
    physics_objects: Mapped[List["PhysicsObject"]] = relationship(
        "PhysicsObject",
        back_populates="scene",
        cascade="all, delete-orphan"
    )
    physics_constraints: Mapped[List["PhysicsConstraint"]] = relationship(
        "PhysicsConstraint",
        back_populates="scene",
        cascade="all, delete-orphan"
    )
    physics_parameters: Mapped[Optional["PhysicsParameter"]] = relationship(
        "PhysicsParameter",
        back_populates="scene",
        uselist=False,
        cascade="all, delete-orphan"
    )
    audio_tracks: Mapped[List["AudioTrack"]] = relationship(
        "AudioTrack",
        back_populates="scene",
        cascade="all, delete-orphan"
    )
    midi_sequences: Mapped[List["MIDISequence"]] = relationship(
        "MIDISequence",
        back_populates="scene",
        cascade="all, delete-orphan"
    )

    # Table configuration
    __table_args__ = {'extend_existing': True}

    def to_dict(self) -> Dict[str, Any]:
        """Convert scene to dictionary with all parameters."""
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

    def update_physics_overrides(self, params: Dict[str, Any]) -> 'Scene':
        """Update physics parameter overrides.

        Args:
            params: Dictionary containing physics parameters to update.

        Returns:
            Updated Scene instance.
        """
        if params.get('enabled') is not None:
            self.physics_overrides['enabled'] = params['enabled']
        if params.get('parameters'):
            self.physics_overrides['parameters'].update(params['parameters'])
        return self

    def update_harmony_overrides(self, params: Dict[str, Any]) -> 'Scene':
        """Update harmony parameter overrides.

        Args:
            params: Dictionary containing harmony parameters to update.

        Returns:
            Updated Scene instance.
        """
        if params.get('enabled') is not None:
            self.harmony_overrides['enabled'] = params['enabled']
        if params.get('parameters'):
            self.harmony_overrides['parameters'].update(params['parameters'])
        return self

    def update_visualization(self, params: Dict[str, Any]) -> 'Scene':
        """Update visualization settings.

        Args:
            params: Dictionary containing visualization parameters to update.

        Returns:
            Updated Scene instance.
        """
        for key, value in params.items():
            if key in self.visualization_settings:
                if isinstance(value, dict):
                    self.visualization_settings[key].update(value)
                else:
                    self.visualization_settings[key] = value
        return self

    def update_ai_settings(self, params: Dict[str, Any]) -> 'Scene':
        """Update AI settings.

        Args:
            params: Dictionary containing AI parameters to update.

        Returns:
            Updated Scene instance.
        """
        for key, value in params.items():
            if key in self.ai_settings:
                if isinstance(value, dict):
                    self.ai_settings[key].update(value)
                else:
                    self.ai_settings[key] = value
        return self

    def update_timeline(self, params: Dict[str, Any]) -> 'Scene':
        """Update timeline settings.

        Args:
            params: Dictionary containing timeline parameters to update.

        Returns:
            Updated Scene instance.
        """
        self.timeline_settings.update(params)
        return self

    def get_effective_physics_params(self, universe_params: Dict[str, Any]) -> Dict[str, Any]:
        """Get effective physics parameters considering overrides.

        Args:
            universe_params: Base universe physics parameters.

        Returns:
            Dictionary containing effective physics parameters.
        """
        if not self.physics_overrides['enabled']:
            return universe_params

        result = universe_params.copy()
        result.update(self.physics_overrides['parameters'])
        return result

    def get_effective_harmony_params(self, universe_params: Dict[str, Any]) -> Dict[str, Any]:
        """Get effective harmony parameters considering overrides.

        Args:
            universe_params: Base universe harmony parameters.

        Returns:
            Dictionary containing effective harmony parameters.
        """
        if not self.harmony_overrides['enabled']:
            return universe_params

        result = universe_params.copy()
        result.update(self.harmony_overrides['parameters'])
        return result

    def __repr__(self) -> str:
        """Get string representation of Scene.

        Returns:
            String representation of the scene.
        """
        return f"<Scene {self.name} (v{self.version})>"
