"""Test factories for creating test objects."""
import factory
from factory.alchemy import SQLAlchemyModelFactory
from app.models import (
    User, Profile, Universe, UniverseAccess,
    Collaborator, Storyboard, Scene,
    VisualEffect, AudioTrack,
    PhysicsObject, PhysicsConstraint
)
from app import db

class BaseFactory(SQLAlchemyModelFactory):
    """Base factory class."""
    class Meta:
        abstract = True
        sqlalchemy_session = db.session

class UserFactory(BaseFactory):
    """Factory for User model."""
    class Meta:
        model = User

    username = factory.Sequence(lambda n: f'user{n}')
    email = factory.Sequence(lambda n: f'user{n}@example.com')
    is_active = True

    @factory.post_generation
    def password(self, create, extracted, **kwargs):
        """Set password after user creation."""
        if not create:
            return
        self.set_password(extracted or 'password123')

class ProfileFactory(BaseFactory):
    """Factory for Profile model."""
    class Meta:
        model = Profile

    user = factory.SubFactory(UserFactory)
    bio = factory.Sequence(lambda n: f'Bio for user {n}')
    preferences = {'theme': 'dark'}

class UniverseFactory(BaseFactory):
    """Factory for Universe model."""
    class Meta:
        model = Universe

    name = factory.Sequence(lambda n: f'Universe {n}')
    description = factory.Sequence(lambda n: f'Description for universe {n}')
    user = factory.SubFactory(UserFactory)
    is_public = True
    max_participants = 10
    collaborators_count = 0
    music_parameters = {}
    visual_parameters = {}

class StoryboardFactory(BaseFactory):
    """Factory for Storyboard model."""
    class Meta:
        model = Storyboard

    name = factory.Sequence(lambda n: f'Storyboard {n}')
    description = factory.Sequence(lambda n: f'Description for storyboard {n}')
    universe = factory.SubFactory(UniverseFactory)

class SceneFactory(BaseFactory):
    """Factory for Scene model."""
    class Meta:
        model = Scene

    name = factory.Sequence(lambda n: f'Scene {n}')
    description = factory.Sequence(lambda n: f'Description for scene {n}')
    sequence = factory.Sequence(lambda n: n)
    storyboard = factory.SubFactory(StoryboardFactory)
    content = {}
    physics_settings = {
        'gravity': {'x': 0, 'y': -9.81},
        'time_step': 1/60,
        'velocity_iterations': 8,
        'position_iterations': 3,
        'enabled': True
    }

class PhysicsObjectFactory(BaseFactory):
    """Factory for PhysicsObject model."""
    class Meta:
        model = PhysicsObject

    name = factory.Sequence(lambda n: f'Physics Object {n}')
    object_type = 'circle'
    scene = factory.SubFactory(SceneFactory)
    position = {'x': 0, 'y': 0}
    dimensions = {'radius': 25}
    mass = 1.0
    velocity = {'x': 0, 'y': 0}
    acceleration = {'x': 0, 'y': 0}
    angle = 0
    angular_velocity = 0
    collision_filter = {'category': 1, 'mask': 0xFFFFFFFF, 'group': 0}
    density = 0.001
    restitution = 0.6
    friction = 0.1
    is_static = False
    is_sensor = False
    render_options = {
        'fillStyle': '#ffffff',
        'strokeStyle': '#000000',
        'lineWidth': 1
    }

class PhysicsConstraintFactory(BaseFactory):
    """Factory for PhysicsConstraint model."""
    class Meta:
        model = PhysicsConstraint

    name = factory.Sequence(lambda n: f'Physics Constraint {n}')
    constraint_type = 'distance'
    scene = factory.SubFactory(SceneFactory)
    object_a = factory.SubFactory(PhysicsObjectFactory)
    object_b = factory.SubFactory(PhysicsObjectFactory)
    anchor_a = {'x': 0, 'y': 0}
    anchor_b = {'x': 0, 'y': 0}
    stiffness = 1.0
    damping = 0.7
    properties = {
        'min_length': 50,
        'max_length': 150,
        'angle_limits': None,
        'axis': {'x': 1, 'y': 0},
        'translation_limits': None
    }

class VisualEffectFactory(BaseFactory):
    """Factory for VisualEffect model."""
    class Meta:
        model = VisualEffect

    name = factory.Sequence(lambda n: f'Visual Effect {n}')
    effect_type = 'fade'
    scene = factory.SubFactory(SceneFactory)
    parameters = {'duration': 1.0}

class AudioTrackFactory(BaseFactory):
    """Factory for AudioTrack model."""
    class Meta:
        model = AudioTrack

    name = factory.Sequence(lambda n: f'Audio Track {n}')
    track_type = 'background'
    scene = factory.SubFactory(SceneFactory)
    parameters = {'volume': 0.8}
