from app import db
from app.models import Favorite


class FavoritesService:
    """Service class for handling favorites operations."""

    @staticmethod
    def add_favorite(user_id, universe_id):
        """Add a universe to user's favorites."""
        existing = Favorite.query.filter_by(
            user_id=user_id, universe_id=universe_id
        ).first()

        if existing:
            return existing

        favorite = Favorite(user_id=user_id, universe_id=universe_id)
        db.session.add(favorite)
        db.session.commit()
        return favorite

    @staticmethod
    def remove_favorite(user_id, universe_id):
        """Remove a universe from user's favorites."""
        favorite = Favorite.query.filter_by(
            user_id=user_id, universe_id=universe_id
        ).first()

        if favorite:
            db.session.delete(favorite)
            db.session.commit()
            return True
        return False

    @staticmethod
    def get_user_favorites(user_id):
        """Get all favorites for a user."""
        return Favorite.query.filter_by(user_id=user_id).all()

    @staticmethod
    def get_favorite_universes(user_id):
        """Get all favorite universes for a user."""
        favorites = Favorite.query.filter_by(user_id=user_id).all()
        return [favorite.universe for favorite in favorites]

    @staticmethod
    def is_favorite(user_id, universe_id):
        """Check if a universe is in user's favorites."""
        return (
            Favorite.query.filter_by(user_id=user_id, universe_id=universe_id).first()
            is not None
        )

    @staticmethod
    def get_favorite_count(universe_id):
        """Get the number of times a universe has been favorited."""
        return Favorite.query.filter_by(universe_id=universe_id).count()
