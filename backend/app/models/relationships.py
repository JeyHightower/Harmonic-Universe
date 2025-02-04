"""
Model relationships.
This module defines relationships between models to avoid circular dependencies.
"""

from sqlalchemy.orm import relationship
from sqlalchemy import event
from sqlalchemy.orm import configure_mappers

def setup_relationships():
    """Set up relationships between models."""
    from backend.app.models.scene import Scene
    from backend.app.models.scene_object import SceneObject
    from backend.app.models.user import User
    from backend.app.models.universe import Universe
    from backend.app.models.ai_generation import AIGeneration
    from backend.app.models.ai_model import AIModel
    from backend.app.models.audio_file import AudioFile
    from backend.app.models.visualization import Visualization
    from backend.app.models.export import Export
    from backend.app.models.physics_constraint import PhysicsConstraint
    from backend.app.models.physics_object import PhysicsObject
    from backend.app.models.timeline import Timeline, Animation
    from backend.app.models.storyboard import Storyboard, storyboard_scenes
    from backend.app.models.midi_event import MidiEvent
    from backend.app.models.keyframe import Keyframe

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
    Universe.creator = relationship(
        "User",
        back_populates="universes",
        lazy="joined"
    )
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

    # Timeline relationships
    Timeline.scene = relationship(
        "Scene",
        back_populates="timelines",
        lazy="selectin"
    )
    Timeline.animations = relationship(
        "Animation",
        back_populates="timeline",
        cascade="all, delete-orphan",
        lazy="selectin"
    )

    # Animation relationships
    Animation.timeline = relationship(
        "Timeline",
        back_populates="animations",
        lazy="selectin"
    )
    Animation.keyframes = relationship(
        "Keyframe",
        back_populates="animation",
        cascade="all, delete-orphan",
        lazy="selectin"
    )

    # Keyframe relationships
    Keyframe.animation = relationship(
        "Animation",
        back_populates="keyframes",
        lazy="selectin"
    )

    # Configure all mappers
    configure_mappers()
