import pytest
from app.models import Universe, User
from app.services.universe import UniverseService

@pytest.mark.unit
@pytest.mark.universe
class TestUniverseService:
    @pytest.fixture
    def user(self, session):
        user = User(username='testuser', email='test@example.com')
        user.set_password('password123')
        session.add(user)
        session.commit()
        return user

    def test_create_universe(self, session, user):
        universe_service = UniverseService()
        universe_data = {
            'name': 'Test Universe',
            'description': 'A test universe',
            'is_public': True,
            'allow_guests': True
        }

        universe = universe_service.create(user.id, universe_data)
        assert universe.name == universe_data['name']
        assert universe.description == universe_data['description']
        assert universe.is_public == universe_data['is_public']
        assert universe.allow_guests == universe_data['allow_guests']
        assert universe.creator_id == user.id

        db_universe = session.query(Universe).filter_by(id=universe.id).first()
        assert db_universe is not None
        assert db_universe.name == universe_data['name']

    def test_get_universe(self, session, user):
        universe_service = UniverseService()
        universe_data = {
            'name': 'Test Universe',
            'description': 'A test universe',
            'is_public': True,
            'allow_guests': True
        }

        created_universe = universe_service.create(user.id, universe_data)
        retrieved_universe = universe_service.get(created_universe.id)

        assert retrieved_universe is not None
        assert retrieved_universe.id == created_universe.id
        assert retrieved_universe.name == universe_data['name']

    def test_update_universe(self, session, user):
        universe_service = UniverseService()
        universe_data = {
            'name': 'Test Universe',
            'description': 'A test universe',
            'is_public': True,
            'allow_guests': True
        }

        universe = universe_service.create(user.id, universe_data)

        update_data = {
            'name': 'Updated Universe',
            'description': 'An updated universe',
            'is_public': False,
            'allow_guests': False
        }

        updated_universe = universe_service.update(universe.id, update_data)
        assert updated_universe.name == update_data['name']
        assert updated_universe.description == update_data['description']
        assert updated_universe.is_public == update_data['is_public']
        assert updated_universe.allow_guests == update_data['allow_guests']

    def test_delete_universe(self, session, user):
        universe_service = UniverseService()
        universe_data = {
            'name': 'Test Universe',
            'description': 'A test universe',
            'is_public': True,
            'allow_guests': True
        }

        universe = universe_service.create(user.id, universe_data)
        universe_service.delete(universe.id)

        db_universe = session.query(Universe).filter_by(id=universe.id).first()
        assert db_universe is None

    def test_list_universes(self, session, user):
        universe_service = UniverseService()
        universe_data = [
            {
                'name': 'Universe 1',
                'description': 'First universe',
                'is_public': True,
                'allow_guests': True
            },
            {
                'name': 'Universe 2',
                'description': 'Second universe',
                'is_public': False,
                'allow_guests': False
            }
        ]

        for data in universe_data:
            universe_service.create(user.id, data)

        universes = universe_service.list(user.id)
        assert len(universes) == 2
        assert universes[0].name == universe_data[0]['name']
        assert universes[1].name == universe_data[1]['name']

    def test_update_privacy_settings(self, session, user):
        universe_service = UniverseService()
        universe_data = {
            'name': 'Test Universe',
            'description': 'A test universe',
            'is_public': True,
            'allow_guests': True
        }

        universe = universe_service.create(user.id, universe_data)

        privacy_settings = {
            'is_public': False,
            'allow_guests': False,
            'collaborators': ['collaborator@example.com'],
            'viewers': ['viewer@example.com']
        }

        updated_universe = universe_service.update_privacy(universe.id, privacy_settings)
        assert updated_universe.is_public == privacy_settings['is_public']
        assert updated_universe.allow_guests == privacy_settings['allow_guests']
        assert len(updated_universe.collaborators) == 1
        assert len(updated_universe.viewers) == 1

    def test_get_user_universes(self, session, user):
        universe_service = UniverseService()
        # Create some public and private universes
        universes_data = [
            {'name': 'Public 1', 'is_public': True},
            {'name': 'Private 1', 'is_public': False},
            {'name': 'Public 2', 'is_public': True}
        ]

        for data in universes_data:
            universe_service.create(user.id, data)

        # Test getting all user universes
        all_universes = universe_service.get_user_universes(user.id)
        assert len(all_universes) == 3

        # Test getting only public universes
        public_universes = universe_service.get_user_universes(user.id, public_only=True)
        assert len(public_universes) == 2
