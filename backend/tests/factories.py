from factory import Factory, Faker, LazyAttribute, SubFactory
from app.models import User, Universe, Scene, Storyboard
from .utils import random_string

class UserFactory(Factory):
    class Meta:
        model = User

    username = Faker('user_name')
    email = Faker('email')
    password_hash = LazyAttribute(lambda _: 'password123')  # Not a real hash, just for testing

class UniverseFactory(Factory):
    class Meta:
        model = Universe

    name = Faker('catch_phrase')
    description = Faker('text', max_nb_chars=200)
    creator = SubFactory(UserFactory)

class SceneFactory(Factory):
    class Meta:
        model = Scene

    name = Faker('sentence', nb_words=3)
    description = Faker('text', max_nb_chars=200)
    universe = SubFactory(UniverseFactory)
    creator = SubFactory(UserFactory)

class StoryboardFactory(Factory):
    class Meta:
        model = Storyboard

    name = Faker('sentence', nb_words=3)
    description = Faker('text', max_nb_chars=200)
    universe = SubFactory(UniverseFactory)
    creator = SubFactory(UserFactory)
