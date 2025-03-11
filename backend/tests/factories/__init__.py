"""Test factories for models."""
import factory
from factory.alchemy import SQLAlchemyModelFactory
from backend.app.models import (
    Scene,
    Storyboard,
    User,
    Universe,
    Collaborator,
    PhysicsParameters,
    VisualEffect,
    AudioTrack,
    Profile,
    PhysicsObject,
    PhysicsConstraint,
    Activity,
)
from backend.app.extensions import db


class BaseFactory(SQLAlchemyModelFactory):
    """Base factory class."""

    class Meta:
        abstract = True
        sqlalchemy_session = db.session


class UserFactory(BaseFactory):
    """Factory for User model."""

    class Meta:
        model = User

    username = factory.Sequence(lambda n: f"user{n}")
    email = factory.Sequence(lambda n: f"user{n}@example.com")
    password_hash = factory.Sequence(lambda n: f"hashed_password{n}")


class UniverseFactory(BaseFactory):
    """Factory for Universe model."""

    class Meta:
        model = Universe

    name = factory.Sequence(lambda n: f"Universe {n}")
    description = factory.Sequence(lambda n: f"Description for Universe {n}")
    creator = factory.SubFactory(UserFactory)
    physics_parameters = factory.SubFactory("tests.factories.PhysicsParametersFactory")


class PhysicsParametersFactory(BaseFactory):
    """Factory for PhysicsParameters model."""

    class Meta:
        model = PhysicsParameters

    gravity = 9.81
    time_dilation = 1.0
    air_density = 1.225
    time_step = 1 / 60
    velocity_iterations = 8
    position_iterations = 3
    universe = factory.SubFactory(UniverseFactory)


class CollaboratorFactory(BaseFactory):
    """Factory for Collaborator model."""

    class Meta:
        model = Collaborator

    universe = factory.SubFactory(UniverseFactory)
    user = factory.SubFactory(UserFactory)
    role = "viewer"


class StoryboardFactory(BaseFactory):
    """Factory for Storyboard model."""

    class Meta:
        model = Storyboard

    name = factory.Sequence(lambda n: f"Storyboard {n}")
    description = factory.Sequence(lambda n: f"Description for Storyboard {n}")
    universe = factory.SubFactory(UniverseFactory)


class SceneFactory(BaseFactory):
    """Factory for Scene model."""

    class Meta:
        model = Scene

    name = factory.Sequence(lambda n: f"Scene {n}")
    description = factory.Sequence(lambda n: f"Description for Scene {n}")
    sequence = factory.Sequence(lambda n: n)
    content = factory.Dict({"layout": "grid", "elements": []})
    storyboard = factory.SubFactory(StoryboardFactory)


class VisualEffectFactory(BaseFactory):
    """Factory for VisualEffect model."""

    class Meta:
        model = VisualEffect

    name = factory.Sequence(lambda n: f"Visual Effect {n}")
    effect_type = "particle"
    parameters = factory.Dict(
        {"particle_count": 100, "particle_size": 5, "particle_color": "#FFFFFF"}
    )
    scene = factory.SubFactory(SceneFactory)


class AudioTrackFactory(BaseFactory):
    """Factory for AudioTrack model."""

    class Meta:
        model = AudioTrack

    name = factory.Sequence(lambda n: f"Audio Track {n}")
    track_type = "background"
    file_path = factory.Sequence(lambda n: f"/path/to/audio{n}.mp3")
    parameters = factory.Dict({"volume": 1.0, "loop": True, "fade_in": 2.0})
    scene = factory.SubFactory(SceneFactory)


class ProfileFactory(BaseFactory):
    """Factory for Profile model."""

    class Meta:
        model = Profile

    user = factory.SubFactory(UserFactory)
    display_name = factory.Sequence(lambda n: f"Display Name {n}")
    bio = factory.Sequence(lambda n: f"Bio for user {n}")
    avatar_url = factory.Sequence(lambda n: f"https://example.com/avatars/{n}.jpg")


class PhysicsObjectFactory(BaseFactory):
    """Factory for PhysicsObject model."""

    class Meta:
        model = PhysicsObject

    name = factory.Sequence(lambda n: f"Physics Object {n}")
    object_type = "circle"
    position = factory.Dict({"x": 0, "y": 0})
    velocity = factory.Dict({"x": 0, "y": 0})
    mass = 1.0
    restitution = 0.5
    friction = 0.2
    parameters = factory.Dict({"radius": 10, "color": "#FF0000", "is_static": False})
    scene = factory.SubFactory(SceneFactory)


class PhysicsConstraintFactory(BaseFactory):
    """Factory for PhysicsConstraint model."""

    class Meta:
        model = PhysicsConstraint

    name = factory.Sequence(lambda n: f"Physics Constraint {n}")
    constraint_type = "distance"
    parameters = factory.Dict({"stiffness": 1.0, "damping": 0.1, "length": 100})
    object_a = factory.SubFactory(PhysicsObjectFactory)
    object_b = factory.SubFactory(PhysicsObjectFactory)
    scene = factory.SubFactory(SceneFactory)


class ActivityFactory(BaseFactory):
    """Factory for Activity model."""

    class Meta:
        model = Activity

    universe = factory.SubFactory(UniverseFactory)
    user = factory.SubFactory(UserFactory)
    action = "create"
    target = "scene"
    details = factory.Dict({"scene_id": 1, "scene_name": "Test Scene"})
