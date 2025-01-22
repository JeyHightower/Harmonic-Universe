from typing import Dict, Optional
from app.models.user_preferences import UserPreferences
from app.extensions import db, cache
from app.models import User

class PreferencesService:
    """Service class for handling user preferences."""

    def __init__(self):
        self.cache = cache
        self.cache_ttl = 300  # 5 minutes

    def get_preferences(self, user_id: int) -> Dict:
        """Get user preferences."""
        cache_key = f"preferences:{user_id}"

        # Try cache first
        cached = self.cache.get(cache_key)
        if cached:
            return cached

        # Get from database
        user = User.query.get_or_404(user_id)
        preferences = user.preferences

        if not preferences:
            # Create default preferences
            preferences = UserPreferences(user_id=user_id)
            db.session.add(preferences)
            db.session.commit()

        result = preferences.to_dict()

        # Cache results
        self.cache.setex(cache_key, self.cache_ttl, result)

        return result

    def update_preferences(self, user_id: int, updates: Dict) -> Dict:
        """Update user preferences."""
        user = User.query.get_or_404(user_id)
        user.preferences.update(updates)
        db.session.commit()

        # Invalidate cache
        self._invalidate_cache(user_id)

        return user.preferences.to_dict()

    def update_theme(self, user_id: int, theme: str) -> Dict:
        """Update user theme preference."""
        if theme not in ['system', 'light', 'dark']:
            raise ValueError('Invalid theme')

        user = User.query.get_or_404(user_id)
        user.preferences['theme'] = theme
        db.session.commit()

        # Invalidate cache
        self._invalidate_cache(user_id)

        return user.preferences

    def update_notification_settings(self, user_id: int, settings: Dict) -> Dict:
        """Update user notification preferences."""
        user = User.query.get_or_404(user_id)
        user.preferences['notifications'] = settings
        db.session.commit()

        # Invalidate cache
        self._invalidate_cache(user_id)

        return user.preferences

    def update_accessibility(self, user_id: int, settings: Dict) -> Dict:
        """Update user accessibility preferences."""
        user = User.query.get_or_404(user_id)
        user.preferences['accessibility'] = settings
        db.session.commit()

        # Invalidate cache
        self._invalidate_cache(user_id)

        return user.preferences

    def update_dashboard_layout(self, user_id: int, layout: Dict) -> Dict:
        """Update user dashboard layout preferences."""
        user = User.query.get_or_404(user_id)
        user.preferences['dashboard_layout'] = layout
        db.session.commit()

        # Invalidate cache
        self._invalidate_cache(user_id)

        return user.preferences

    def update_localization(self, user_id: int, language: str, timezone: str) -> Dict:
        """Update user localization preferences."""
        user = User.query.get_or_404(user_id)
        user.preferences['localization'] = {
            'language': language,
            'timezone': timezone
        }
        db.session.commit()

        # Invalidate cache
        self._invalidate_cache(user_id)

        return user.preferences

    def _invalidate_cache(self, user_id: int):
        """Invalidate user preferences cache."""
        self.cache.delete(f"preferences:{user_id}")

# Create a singleton instance
preferences_service = PreferencesService()
