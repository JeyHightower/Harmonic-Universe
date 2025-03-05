"""Test factories for models."""
import factory
from factory.alchemy import SQLAlchemyModelFactory
from backend.app.models import (
    Scene, User, Universe,
    PhysicsParameters, AudioTrack,
    PhysicsObject, PhysicsConstraint
)
from backend.app.models.visualization.visualization import Visualization
from backend.app.db.session import db_session as db

class BaseFactory(SQLAlchemyModelFactory):
    """Base factory class."""
    class Meta:
        abstract = True
        sqlalchemy_session = db

class UserFactory(BaseFactory):
    """Factory for User model."""
    class Meta:
        model = User

    username = factory.Sequence(lambda n: f'user{n}')
    email = factory.Sequence(lambda n: f'user{n}@example.com')
    password_hash = factory.Sequence(lambda n: f'hashed_password{n}')

class UniverseFactory(BaseFactory):
    """Factory for Universe model."""
    class Meta:
        model = Universe

    name = factory.Sequence(lambda n: f'Universe {n}')
    description = factory.Sequence(lambda n: f'Description for Universe {n}')
    creator = factory.SubFactory(UserFactory)
    physics_parameters = factory.SubFactory('tests.factories.PhysicsParametersFactory')

class PhysicsParametersFactory(BaseFactory):
    """Factory for PhysicsParameters model."""
    class Meta:
        model = PhysicsParameters

    gravity = 9.81
    time_dilation = 1.0
    air_density = 1.225
    time_step = 1/60
    velocity_iterations = 8
    position_iterations = 3
    universe = factory.SubFactory(UniverseFactory)

class SceneFactory(BaseFactory):
    """Factory for Scene model."""
    class Meta:
        model = Scene

    name = factory.Sequence(lambda n: f'Scene {n}')
    description = factory.Sequence(lambda n: f'Description for Scene {n}')
    sequence = factory.Sequence(lambda n: n)
    content = factory.Dict({'layout': 'grid', 'elements': []})
    universe = factory.SubFactory(UniverseFactory)

class VisualizationFactory(BaseFactory):
    """Factory for Visualization model."""
    class Meta:
        model = Visualization

    title = factory.Sequence(lambda n: f'Visualization {n}')
    type = 'waveform'
    settings = factory.Dict({
        'color': '#FFFFFF',
        'amplitude': 1.0
    })
    universe = factory.SubFactory(UniverseFactory)

class AudioTrackFactory(BaseFactory):
    """Factory for AudioTrack model."""
    class Meta:
        model = AudioTrack

    name = factory.Sequence(lambda n: f'Audio Track {n}')
    track_type = 'background'
    file_path = factory.Sequence(lambda n: f'/path/to/audio{n}.mp3')
    parameters = factory.Dict({
        'volume': 1.0,
        'loop': True,
        'fade_in': 2.0
    })
    scene = factory.SubFactory(SceneFactory)

class PhysicsObjectFactory(BaseFactory):
    """Factory for PhysicsObject model."""
    class Meta:
        model = PhysicsObject

    name = factory.Sequence(lambda n: f'Physics Object {n}')
    object_type = 'circle'
    position = factory.Dict({'x': 0, 'y': 0})
    velocity = factory.Dict({'x': 0, 'y': 0})
    mass = 1.0
    restitution = 0.5
    friction = 0.2
    parameters = factory.Dict({
        'radius': 10,
        'color': '#FF0000',
        'is_static': False
    })
    scene = factory.SubFactory(SceneFactory)

class PhysicsConstraintFactory(BaseFactory):
    """Factory for PhysicsConstraint model."""
    class Meta:
        model = PhysicsConstraint

    name = factory.Sequence(lambda n: f'Physics Constraint {n}')
    constraint_type = 'distance'
    parameters = factory.Dict({
        'stiffness': 1.0,
        'damping': 0.1,
        'length': 100
    })
    object_a = factory.SubFactory(PhysicsObjectFactory)
    object_b = factory.SubFactory(PhysicsObjectFactory)
    scene = factory.SubFactory(SceneFactory)
