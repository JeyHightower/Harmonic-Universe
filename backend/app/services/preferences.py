from typing import Dict, Optional
from app.models.user_preferences import UserPreferences
from app.extensions import db, cache

class PreferencesService:
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
        preferences = UserPreferences.query.filter_by(user_id=user_id).first()

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
        preferences = UserPreferences.query.filter_by(user_id=user_id).first()

        if not preferences:
            preferences = UserPreferences(user_id=user_id)
            db.session.add(preferences)

        # Update preferences
        preferences.update(**updates)
        db.session.commit()

        # Invalidate cache
        self._invalidate_cache(user_id)

        return preferences.to_dict()

    def update_theme(self, user_id: int, theme: str) -> Dict:
        """Update user theme preference."""
        if theme not in ['system', 'light', 'dark']:
            raise ValueError('Invalid theme')

        return self.update_preferences(user_id, {'theme': theme})

    def update_notification_settings(self, user_id: int, settings: Dict) -> Dict:
        """Update user notification preferences."""
        return self.update_preferences(user_id, {
            'notifications_enabled': settings.get('enabled', True),
            'notification_types': settings.get('types', {
                'system': True,
                'alert': True,
                'message': True
            }),
            'email_notifications': settings.get('email', True),
            'push_notifications': settings.get('push', True)
        })

    def update_accessibility(self, user_id: int, settings: Dict) -> Dict:
        """Update user accessibility preferences."""
        return self.update_preferences(user_id, {
            'accessibility': {
                'high_contrast': settings.get('high_contrast', False),
                'reduced_motion': settings.get('reduced_motion', False),
                'font_size': settings.get('font_size', 'medium')
            }
        })

    def update_dashboard_layout(self, user_id: int, layout: Dict) -> Dict:
        """Update user dashboard layout preferences."""
        return self.update_preferences(user_id, {
            'dashboard_layout': {
                'widgets': layout.get('widgets', ['notifications', 'analytics', 'recent_activity']),
                'layout': layout.get('layout', 'grid')
            }
        })

    def update_localization(self, user_id: int, language: str, timezone: str) -> Dict:
        """Update user localization preferences."""
        return self.update_preferences(user_id, {
            'language': language,
            'timezone': timezone
        })

    def _invalidate_cache(self, user_id: int):
        """Invalidate user preferences cache."""
        self.cache.delete(f"preferences:{user_id}")

preferences_service = PreferencesService()
