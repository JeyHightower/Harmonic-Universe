import pytest
from app.models import User, Universe, Favorite
from app.services.favorites import FavoritesService

@pytest.mark.unit
@pytest.mark.favorites
class TestFavoritesService:
    @pytest.fixture
    def user(self, session):
        user = User(username='testuser', email='test@example.com')
        user.set_password('password123')
        session.add(user)
        session.commit()
        return user

    @pytest.fixture
    def universe(self, session, user):
        universe = Universe(
            name='Test Universe',
            description='A test universe',
            creator_id=user.id,
            is_public=True
        )
        session.add(universe)
        session.commit()
        return universe

    def test_add_favorite(self, session, user, universe):
        favorites_service = FavoritesService()
        favorite = favorites_service.add(user.id, universe.id)

        assert favorite is not None
        assert favorite.user_id == user.id
        assert favorite.universe_id == universe.id

        db_favorite = session.query(Favorite).filter_by(
            user_id=user.id,
            universe_id=universe.id
        ).first()
        assert db_favorite is not None

    def test_remove_favorite(self, session, user, universe):
        favorites_service = FavoritesService()
        favorite = favorites_service.add(user.id, universe.id)

        favorites_service.remove(user.id, universe.id)

        db_favorite = session.query(Favorite).filter_by(
            user_id=user.id,
            universe_id=universe.id
        ).first()
        assert db_favorite is None

    def test_get_user_favorites(self, session, user):
        favorites_service = FavoritesService()

        # Create multiple universes
        universes = []
        for i in range(3):
            universe = Universe(
                name=f'Universe {i}',
                description=f'Description {i}',
                creator_id=user.id,
                is_public=True
            )
            session.add(universe)
            session.commit()
            universes.append(universe)

            # Add to favorites
            favorites_service.add(user.id, universe.id)

        # Get user favorites
        favorites = favorites_service.get_user_favorites(user.id)
        assert len(favorites) == 3
        assert all(f.universe_id in [u.id for u in universes] for f in favorites)

    def test_check_is_favorite(self, session, user, universe):
        favorites_service = FavoritesService()

        # Initially not favorite
        assert not favorites_service.is_favorite(user.id, universe.id)

        # Add to favorites
        favorites_service.add(user.id, universe.id)
        assert favorites_service.is_favorite(user.id, universe.id)

        # Remove from favorites
        favorites_service.remove(user.id, universe.id)
        assert not favorites_service.is_favorite(user.id, universe.id)

    def test_get_favorite_count(self, session, user, universe):
        favorites_service = FavoritesService()

        # Initially no favorites
        assert favorites_service.get_favorite_count(universe.id) == 0

        # Add favorite
        favorites_service.add(user.id, universe.id)
        assert favorites_service.get_favorite_count(universe.id) == 1

        # Create another user and add favorite
        other_user = User(username='other', email='other@example.com')
        other_user.set_password('password123')
        session.add(other_user)
        session.commit()

        favorites_service.add(other_user.id, universe.id)
        assert favorites_service.get_favorite_count(universe.id) == 2

    def test_get_recent_favorites(self, session, user):
        favorites_service = FavoritesService()

        # Create multiple universes and add to favorites
        universes = []
        for i in range(5):
            universe = Universe(
                name=f'Universe {i}',
                description=f'Description {i}',
                creator_id=user.id,
                is_public=True
            )
            session.add(universe)
            session.commit()
            universes.append(universe)

            favorites_service.add(user.id, universe.id)

        # Get recent favorites (default limit is 3)
        recent_favorites = favorites_service.get_recent_favorites(user.id)
        assert len(recent_favorites) == 3

        # Verify order (most recent first)
        assert recent_favorites[0].universe_id == universes[-1].id
        assert recent_favorites[1].universe_id == universes[-2].id
        assert recent_favorites[2].universe_id == universes[-3].id

    def test_bulk_remove_favorites(self, session, user):
        favorites_service = FavoritesService()

        # Create multiple universes and add to favorites
        universe_ids = []
        for i in range(3):
            universe = Universe(
                name=f'Universe {i}',
                description=f'Description {i}',
                creator_id=user.id,
                is_public=True
            )
            session.add(universe)
            session.commit()
            universe_ids.append(universe.id)
            favorites_service.add(user.id, universe.id)

        # Remove multiple favorites at once
        favorites_service.bulk_remove(user.id, universe_ids[:2])

        # Verify only the first two were removed
        remaining_favorites = favorites_service.get_user_favorites(user.id)
        assert len(remaining_favorites) == 1
        assert remaining_favorites[0].universe_id == universe_ids[2]
