"""Preferences service for handling user preferences."""
from typing import Dict, Optional
from app.models import UserPreferences, User
from app.extensions import db, cache

class PreferencesService:
    """Service class for handling user preferences."""

    def __init__(self):
        self.cache = cache
        self.cache_ttl = 300  # 5 minutes

    def get_user_preferences(self, user_id: int) -> Dict:
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

    def update_user_preferences(self, user_id: int, updates: Dict) -> Dict:
        """Update user preferences."""
        user = User.query.get_or_404(user_id)
        preferences = user.preferences or UserPreferences(user_id=user_id)
        preferences.update(updates)
        db.session.commit()

        # Invalidate cache
        self._invalidate_cache(user_id)

        return preferences.to_dict()

    def reset_user_preferences(self, user_id: int) -> Dict:
        """Reset user preferences to default."""
        user = User.query.get_or_404(user_id)
        if user.preferences:
            db.session.delete(user.preferences)

        preferences = UserPreferences(user_id=user_id)
        db.session.add(preferences)
        db.session.commit()

        # Invalidate cache
        self._invalidate_cache(user_id)

        return preferences.to_dict()

    def update_theme(self, user_id: int, theme: str) -> Dict:
        """Update user theme preference."""
        if theme not in ['system', 'light', 'dark']:
            raise ValueError('Invalid theme')

        return self.update_user_preferences(user_id, {'theme': theme})

    def update_notification_settings(self, user_id: int, settings: Dict) -> Dict:
        """Update user notification preferences."""
        return self.update_user_preferences(user_id, {'notifications': settings})

    def update_accessibility(self, user_id: int, settings: Dict) -> Dict:
        """Update user accessibility preferences."""
        return self.update_user_preferences(user_id, {'accessibility': settings})

    def update_dashboard_layout(self, user_id: int, layout: Dict) -> Dict:
        """Update user dashboard layout preferences."""
        return self.update_user_preferences(user_id, {'dashboard_layout': layout})

    def update_localization(self, user_id: int, settings: Dict) -> Dict:
        """Update user localization preferences."""
        return self.update_user_preferences(user_id, {'localization': settings})

    def _invalidate_cache(self, user_id: int):
        """Invalidate user preferences cache."""
        self.cache.delete(f"preferences:{user_id}")

# Create a singleton instance
preferences_service = PreferencesService()
