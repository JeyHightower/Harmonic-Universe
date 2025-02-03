"""
Model relationships.
This module defines relationships between models to avoid circular dependencies.
"""

from sqlalchemy.orm import relationship

def setup_relationships():
    """Set up relationships between models."""
    from app.models.scene import Scene
    from app.models.scene_object import SceneObject
    from app.models.user import User
    from app.models.universe import Universe
    from app.models.ai_generation import AIGeneration
    from app.models.ai_model import AIModel
    from app.models.audio_file import AudioFile
    from app.models.visualization import Visualization
    from app.models.export import Export
    from app.models.physics_constraint import PhysicsConstraint
    from app.models.physics_object import PhysicsObject
    from app.models.timeline import Timeline
    from app.models.storyboard import Storyboard, storyboard_scenes
    from app.models.midi_event import MidiEvent

    # Scene and SceneObject relationships
    Scene.objects = relationship(
        "SceneObject",
        back_populates="scene",
        cascade="all, delete-orphan",
        lazy="joined"
    )
    SceneObject.scene = relationship(
        "Scene",
        back_populates="objects",
        lazy="joined"
    )

    # User relationships
    User.generations = relationship(
        "AIGeneration",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    User.universes = relationship(
        "Universe",
        back_populates="creator",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    User.scenes = relationship(
        "Scene",
        back_populates="creator",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    User.audio_files = relationship(
        "AudioFile",
        back_populates="creator",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    User.storyboards = relationship(
        "Storyboard",
        back_populates="creator",
        cascade="all, delete-orphan",
        lazy="selectin"
    )

    # Universe relationships
    Universe.scenes = relationship(
        "Scene",
        back_populates="universe",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    Universe.audio_files = relationship(
        "AudioFile",
        back_populates="universe",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    Universe.ai_generations = relationship(
        "AIGeneration",
        back_populates="universe",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    Universe.storyboards = relationship(
        "Storyboard",
        back_populates="universe",
        cascade="all, delete-orphan",
        lazy="selectin"
    )

    # AIModel relationships
    AIModel.generations = relationship(
        "AIGeneration",
        back_populates="model",
        cascade="all, delete-orphan",
        lazy="selectin"
    )

    # AIGeneration relationships
    AIGeneration.model = relationship(
        "AIModel",
        back_populates="generations",
        lazy="selectin"
    )
    AIGeneration.user = relationship(
        "User",
        back_populates="generations",
        lazy="selectin"
    )
    AIGeneration.universe = relationship(
        "Universe",
        back_populates="ai_generations",
        lazy="selectin"
    )

    # Scene relationships
    Scene.creator = relationship(
        "User",
        back_populates="scenes",
        lazy="selectin"
    )
    Scene.universe = relationship(
        "Universe",
        back_populates="scenes",
        lazy="selectin"
    )
    Scene.visualizations = relationship(
        "Visualization",
        back_populates="scene",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    Scene.exports = relationship(
        "Export",
        back_populates="scene",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    Scene.physics_constraints = relationship(
        "PhysicsConstraint",
        back_populates="scene",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    Scene.physics_objects = relationship(
        "PhysicsObject",
        back_populates="scene",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    Scene.timelines = relationship(
        "Timeline",
        back_populates="scene",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    Scene.storyboards = relationship(
        "Storyboard",
        secondary=storyboard_scenes,
        back_populates="scenes",
        lazy="selectin"
    )

    # AudioFile relationships
    AudioFile.creator = relationship(
        "User",
        back_populates="audio_files",
        lazy="selectin"
    )
    AudioFile.universe = relationship(
        "Universe",
        back_populates="audio_files",
        lazy="selectin"
    )
    AudioFile.midi_events = relationship(
        "MidiEvent",
        back_populates="audio_file",
        cascade="all, delete-orphan",
        lazy="selectin"
    )

    # Storyboard relationships
    Storyboard.universe = relationship(
        "Universe",
        back_populates="storyboards",
        lazy="selectin"
    )
    Storyboard.creator = relationship(
        "User",
        back_populates="storyboards",
        lazy="selectin"
    )
    Storyboard.scenes = relationship(
        "Scene",
        secondary=storyboard_scenes,
        back_populates="storyboards",
        lazy="selectin"
    )

    # MidiEvent relationships
    MidiEvent.audio_file = relationship(
        "AudioFile",
        back_populates="midi_events",
        lazy="selectin"
    )
