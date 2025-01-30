import factory
from factory.alchemy import SQLAlchemyModelFactory
from faker import Faker
from backend.app.models import db, User, Universe, Storyboard, Scene, VisualEffect, AudioTrack

fake = Faker()

class BaseFactory(SQLAlchemyModelFactory):
    class Meta:
        abstract = True
        sqlalchemy_session = db.session

class UserFactory(BaseFactory):
    class Meta:
        model = User

    username = factory.Sequence(lambda n: f'user_{n}')
    email = factory.LazyAttribute(lambda obj: f'{obj.username}@example.com')
    password_hash = factory.LazyAttribute(lambda _: 'hashed_password')

class UniverseFactory(BaseFactory):
    class Meta:
        model = Universe

    name = factory.LazyFunction(lambda: fake.unique.company())
    description = factory.LazyFunction(fake.text)
    user = factory.SubFactory(UserFactory)

class StoryboardFactory(BaseFactory):
    class Meta:
        model = Storyboard

    name = factory.LazyFunction(lambda: fake.unique.catch_phrase())
    description = factory.LazyFunction(fake.text)
    universe = factory.SubFactory(UniverseFactory)

class SceneFactory(BaseFactory):
    class Meta:
        model = Scene

    name = factory.LazyFunction(lambda: fake.unique.bs())
    description = factory.LazyFunction(fake.text)
    sequence = factory.Sequence(lambda n: n)
    content = factory.LazyFunction(lambda: fake.json())
    storyboard = factory.SubFactory(StoryboardFactory)

class VisualEffectFactory(BaseFactory):
    class Meta:
        model = VisualEffect

    name = factory.LazyFunction(lambda: fake.unique.word())
    effect_type = factory.LazyFunction(lambda: fake.random_element(elements=['particle', 'animation', 'filter']))
    parameters = factory.LazyFunction(lambda: fake.json())
    scene = factory.SubFactory(SceneFactory)

class AudioTrackFactory(BaseFactory):
    class Meta:
        model = AudioTrack

    name = factory.LazyFunction(lambda: fake.unique.word())
    track_type = factory.LazyFunction(lambda: fake.random_element(elements=['background', 'effect', 'voice']))
    file_path = factory.LazyFunction(lambda: f'audio/{fake.file_name(extension="mp3")}')
    parameters = factory.LazyFunction(lambda: fake.json())
    scene = factory.SubFactory(SceneFactory)
