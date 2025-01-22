from flask import Blueprint, jsonify, request

preferences_bp = Blueprint('preferences', __name__)

# In-memory storage for user preferences (replace with database in production)
preferences_db = {}

@preferences_bp.route('/api/preferences', methods=['GET'])
def get_preferences():
    # For demo purposes, using a fixed user ID
    user_id = 1

    # Return default preferences if none exist
    if user_id not in preferences_db:
        preferences_db[user_id] = {
            'theme': 'light',
            'emailNotifications': True,
            'pushNotifications': True,
            'highContrast': False,
            'fontSize': 16,
            'dashboardLayout': 'grid',
            'language': 'en',
            'timezone': 'UTC',
        }

    return jsonify(preferences_db[user_id])

@preferences_bp.route('/api/preferences', methods=['PUT'])
def update_preferences():
    # For demo purposes, using a fixed user ID
    user_id = 1

    # Get the preferences from the request body
    preferences = request.json

    # Update the preferences in the database
    preferences_db[user_id] = {
        'theme': preferences.get('theme', 'light'),
        'emailNotifications': preferences.get('emailNotifications', True),
        'pushNotifications': preferences.get('pushNotifications', True),
        'highContrast': preferences.get('highContrast', False),
        'fontSize': preferences.get('fontSize', 16),
        'dashboardLayout': preferences.get('dashboardLayout', 'grid'),
        'language': preferences.get('language', 'en'),
        'timezone': preferences.get('timezone', 'UTC'),
    }

    return jsonify(preferences_db[user_id])
