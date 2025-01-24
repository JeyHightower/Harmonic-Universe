import pytest
from app.models import User, Profile
from app.services.profile import ProfileService

@pytest.mark.unit
@pytest.mark.profile
class TestProfileService:
    @pytest.fixture
    def user(self, session):
        user = User(username='testuser', email='test@example.com')
        user.set_password('password123')
        session.add(user)
        session.commit()
        return user

    def test_create_profile(self, session, user):
        profile_service = ProfileService()
        profile_data = {
            'bio': 'Test bio',
            'avatar_url': 'https://example.com/avatar.jpg',
            'display_name': 'Test User',
            'location': 'Test Location'
        }

        profile = profile_service.create(user.id, profile_data)
        assert profile.bio == profile_data['bio']
        assert profile.avatar_url == profile_data['avatar_url']
        assert profile.display_name == profile_data['display_name']
        assert profile.location == profile_data['location']
        assert profile.user_id == user.id

        db_profile = session.query(Profile).filter_by(user_id=user.id).first()
        assert db_profile is not None
        assert db_profile.bio == profile_data['bio']

    def test_get_profile(self, session, user):
        profile_service = ProfileService()
        profile_data = {
            'bio': 'Test bio',
            'avatar_url': 'https://example.com/avatar.jpg',
            'display_name': 'Test User',
            'location': 'Test Location'
        }

        created_profile = profile_service.create(user.id, profile_data)
        retrieved_profile = profile_service.get(user.id)

        assert retrieved_profile is not None
        assert retrieved_profile.id == created_profile.id
        assert retrieved_profile.bio == profile_data['bio']

    def test_update_profile(self, session, user):
        profile_service = ProfileService()
        profile_data = {
            'bio': 'Test bio',
            'avatar_url': 'https://example.com/avatar.jpg',
            'display_name': 'Test User',
            'location': 'Test Location'
        }

        profile = profile_service.create(user.id, profile_data)

        update_data = {
            'bio': 'Updated bio',
            'avatar_url': 'https://example.com/new-avatar.jpg',
            'display_name': 'Updated User',
            'location': 'Updated Location'
        }

        updated_profile = profile_service.update(user.id, update_data)
        assert updated_profile.bio == update_data['bio']
        assert updated_profile.avatar_url == update_data['avatar_url']
        assert updated_profile.display_name == update_data['display_name']
        assert updated_profile.location == update_data['location']

    def test_update_avatar(self, session, user):
        profile_service = ProfileService()
        profile_data = {
            'bio': 'Test bio',
            'avatar_url': 'https://example.com/avatar.jpg',
            'display_name': 'Test User'
        }

        profile = profile_service.create(user.id, profile_data)

        new_avatar_url = 'https://example.com/new-avatar.jpg'
        updated_profile = profile_service.update_avatar(user.id, new_avatar_url)
        assert updated_profile.avatar_url == new_avatar_url

    def test_delete_profile(self, session, user):
        profile_service = ProfileService()
        profile_data = {
            'bio': 'Test bio',
            'avatar_url': 'https://example.com/avatar.jpg',
            'display_name': 'Test User'
        }

        profile = profile_service.create(user.id, profile_data)
        profile_service.delete(user.id)

        db_profile = session.query(Profile).filter_by(user_id=user.id).first()
        assert db_profile is None

    def test_get_profile_settings(self, session, user):
        profile_service = ProfileService()
        profile_data = {
            'bio': 'Test bio',
            'avatar_url': 'https://example.com/avatar.jpg',
            'display_name': 'Test User',
            'settings': {
                'theme': 'dark',
                'notifications_enabled': True,
                'language': 'en'
            }
        }

        profile = profile_service.create(user.id, profile_data)
        settings = profile_service.get_settings(user.id)

        assert settings['theme'] == profile_data['settings']['theme']
        assert settings['notifications_enabled'] == profile_data['settings']['notifications_enabled']
        assert settings['language'] == profile_data['settings']['language']

    def test_update_profile_settings(self, session, user):
        profile_service = ProfileService()
        profile_data = {
            'bio': 'Test bio',
            'avatar_url': 'https://example.com/avatar.jpg',
            'display_name': 'Test User',
            'settings': {
                'theme': 'light',
                'notifications_enabled': False,
                'language': 'en'
            }
        }

        profile = profile_service.create(user.id, profile_data)

        new_settings = {
            'theme': 'dark',
            'notifications_enabled': True,
            'language': 'es'
        }

        updated_settings = profile_service.update_settings(user.id, new_settings)
        assert updated_settings['theme'] == new_settings['theme']
        assert updated_settings['notifications_enabled'] == new_settings['notifications_enabled']
        assert updated_settings['language'] == new_settings['language']
