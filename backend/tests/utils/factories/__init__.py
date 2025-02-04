"""Test factories for model instances."""

import factory
from factory.alchemy import SQLAlchemyModelFactory
from sqlalchemy.orm import Session
from typing import Dict, Any
from datetime import datetime
import uuid

from app.db.session import SessionLocal
from app.models.core.user import User
from app.models.core.universe import Universe
from app.models.core.scene import Scene
from app.models.audio.audio_file import AudioFile
from app.models.ai.ai_model import AIModel
from app.models.ai.ai_generation import AIGeneration
from app.models.organization.storyboard import Storyboard
from app.models.organization.timeline import Timeline
from app.models.physics.physics_parameter import PhysicsParameter
from app.models.audio.music_parameter import MusicParameter
from app.core.security import get_password_hash


class BaseFactory(SQLAlchemyModelFactory):
    """Base factory for all model factories."""

    class Meta:
        abstract = True
        sqlalchemy_session_persistence = "commit"

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        """Override to support both sync and async sessions."""
        session = cls._meta.sqlalchemy_session
        obj = model_class(*args, **kwargs)
        session.add(obj)
        session.commit()
        session.refresh(obj)
        return obj


class UserFactory(BaseFactory):
    """Factory for User model."""

    class Meta:
        model = User
        sqlalchemy_session = Session

    username = factory.Sequence(lambda n: f"user{n}")
    email = factory.LazyAttribute(lambda o: f"{o.username}@example.com")
    hashed_password = factory.LazyFunction(lambda: get_password_hash("testpass123"))
    is_superuser = False


class UniverseFactory(BaseFactory):
    """Factory for Universe model."""

    class Meta:
        model = Universe
        sqlalchemy_session = Session

    name = factory.Sequence(lambda n: f"Universe {n}")
    description = factory.Faker("text")
    creator = factory.SubFactory(UserFactory)
    physics_json = factory.Dict({})
    music_parameters = factory.Dict({})


class SceneFactory(BaseFactory):
    """Factory for Scene model."""

    class Meta:
        model = Scene
        sqlalchemy_session = Session

    name = factory.Sequence(lambda n: f"Scene {n}")
    description = factory.Faker("text")
    creator = factory.SubFactory(UserFactory)
    universe = factory.SubFactory(UniverseFactory)


class AudioFileFactory(BaseFactory):
    """Factory for AudioFile model."""

    class Meta:
        model = AudioFile
        sqlalchemy_session = Session

    name = factory.Sequence(lambda n: f"Audio {n}")
    description = factory.Faker("text")
    creator = factory.SubFactory(UserFactory)
    universe = factory.SubFactory(UniverseFactory)
    scene = factory.SubFactory(SceneFactory)
    file_url = factory.Faker("url")
    format = factory.Iterator(["WAV", "MP3", "OGG", "MIDI"])
    type = factory.Iterator(["MUSIC", "SOUND_EFFECT", "VOICE"])
    duration = factory.Faker("pyfloat", positive=True)


class AIModelFactory(BaseFactory):
    """Factory for AIModel model."""

    class Meta:
        model = AIModel
        sqlalchemy_session = Session

    name = factory.Sequence(lambda n: f"Model {n}")
    description = factory.Faker("text")
    parameters = factory.Dict({
        "temperature": 0.7,
        "max_tokens": 100,
        "top_p": 1.0
    })


class AIGenerationFactory(BaseFactory):
    """Factory for AIGeneration model."""

    class Meta:
        model = AIGeneration
        sqlalchemy_session = Session

    prompt = factory.Faker("text")
    result = factory.Faker("text")
    creator = factory.SubFactory(UserFactory)
    universe = factory.SubFactory(UniverseFactory)
    scene = factory.SubFactory(SceneFactory)
    rendering_mode = factory.Iterator(["DRAFT", "FINAL"])


class StoryboardFactory(BaseFactory):
    """Factory for Storyboard model."""

    class Meta:
        model = Storyboard
        sqlalchemy_session = Session

    name = factory.Sequence(lambda n: f"Storyboard {n}")
    description = factory.Faker("text")
    creator = factory.SubFactory(UserFactory)
    universe = factory.SubFactory(UniverseFactory)


class TimelineFactory(BaseFactory):
    """Factory for Timeline model."""

    class Meta:
        model = Timeline
        sqlalchemy_session = Session

    name = factory.Sequence(lambda n: f"Timeline {n}")
    description = factory.Faker("text")
    creator = factory.SubFactory(UserFactory)
    universe = factory.SubFactory(UniverseFactory)
    scene = factory.SubFactory(SceneFactory)
