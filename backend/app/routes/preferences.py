"""Preferences routes."""
from flask import Blueprint, jsonify, request
from app.services.preferences import preferences_service
from app.utils.auth import require_auth
from flask_jwt_extended import get_jwt_identity

preferences_bp = Blueprint('preferences', __name__)

# Mock database for testing
preferences_db = {}

@preferences_bp.route('/preferences', methods=['GET'])
@require_auth
def get_preferences():
    """Get user preferences."""
    user_id = get_jwt_identity()
    preferences = preferences_service.get_user_preferences(user_id)
    return jsonify(preferences), 200

@preferences_bp.route('/preferences', methods=['PUT'])
@require_auth
def update_preferences():
    """Update user preferences."""
    user_id = get_jwt_identity()
    data = request.get_json()

    preferences = preferences_service.update_user_preferences(user_id, data)
    return jsonify(preferences), 200

@preferences_bp.route('/preferences/reset', methods=['POST'])
@require_auth
def reset_preferences():
    """Reset user preferences to default."""
    user_id = get_jwt_identity()
    preferences = preferences_service.reset_user_preferences(user_id)
    return jsonify(preferences), 200

@preferences_bp.route('/preferences/theme', methods=['PATCH'])
@require_auth
def update_theme():
    """Update user theme preference."""
    user_id = get_jwt_identity()
    theme = request.json.get('theme')

    if not theme:
        return jsonify({'error': 'Theme not provided'}), 400

    try:
        preferences = preferences_service.update_theme(user_id, theme)
        return jsonify(preferences), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

@preferences_bp.route('/preferences/notifications', methods=['PATCH'])
@require_auth
def update_notification_settings():
    """Update user notification settings."""
    user_id = get_jwt_identity()
    settings = request.get_json()

    if not settings:
        return jsonify({'error': 'Settings not provided'}), 400

    preferences = preferences_service.update_notification_settings(user_id, settings)
    return jsonify(preferences), 200

@preferences_bp.route('/preferences/accessibility', methods=['PATCH'])
@require_auth
def update_accessibility():
    """Update user accessibility settings."""
    user_id = get_jwt_identity()
    settings = request.get_json()

    if not settings:
        return jsonify({'error': 'Settings not provided'}), 400

    preferences = preferences_service.update_accessibility(user_id, settings)
    return jsonify(preferences), 200

@preferences_bp.route('/preferences/dashboard', methods=['PATCH'])
@require_auth
def update_dashboard_layout():
    """Update user dashboard layout."""
    user_id = get_jwt_identity()
    layout = request.get_json()

    if not layout:
        return jsonify({'error': 'Layout not provided'}), 400

    preferences = preferences_service.update_dashboard_layout(user_id, layout)
    return jsonify(preferences), 200

@preferences_bp.route('/preferences/localization', methods=['PATCH'])
@require_auth
def update_localization():
    """Update user localization settings."""
    user_id = get_jwt_identity()
    settings = request.get_json()

    if not settings:
        return jsonify({'error': 'Settings not provided'}), 400

    preferences = preferences_service.update_localization(user_id, settings)
    return jsonify(preferences), 200

@preferences_bp.route('', methods=['GET', 'PUT'])
def handle_preferences():
    # For testing, we'll use a fixed user ID
    user_id = 1

    if request.method == 'GET':
        # Return default preferences if none exist
        return jsonify(preferences_db.get(user_id, {
            "theme": "light",
            "emailNotifications": True,
            "pushNotifications": True,
            "highContrast": False,
            "fontSize": 16,
            "dashboardLayout": "grid",
            "language": "en",
            "timezone": "UTC"
        }))

    data = request.get_json()
    preferences_db[user_id] = data
    return jsonify(data)
