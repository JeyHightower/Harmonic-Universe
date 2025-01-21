from flask import Blueprint, jsonify, request
from app.services.preferences import preferences_service
from app.auth import require_auth, get_current_user

bp = Blueprint('preferences', __name__, url_prefix='/api/preferences')

@bp.route('/', methods=['GET'])
@require_auth
def get_preferences():
    """Get user preferences."""
    try:
        user = get_current_user()
        preferences = preferences_service.get_preferences(user.id)
        return jsonify(preferences)
    except Exception as e:
        return jsonify({
            'error': f'Failed to fetch preferences: {str(e)}'
        }), 500

@bp.route('/', methods=['PATCH'])
@require_auth
def update_preferences():
    """Update user preferences."""
    try:
        user = get_current_user()
        updates = request.get_json()

        if not updates:
            return jsonify({
                'error': 'No updates provided'
            }), 400

        preferences = preferences_service.update_preferences(user.id, updates)
        return jsonify(preferences)
    except Exception as e:
        return jsonify({
            'error': f'Failed to update preferences: {str(e)}'
        }), 500

@bp.route('/theme', methods=['PATCH'])
@require_auth
def update_theme():
    """Update user theme preference."""
    try:
        user = get_current_user()
        theme = request.json.get('theme')

        if not theme:
            return jsonify({
                'error': 'Theme not provided'
            }), 400

        preferences = preferences_service.update_theme(user.id, theme)
        return jsonify(preferences)
    except ValueError as e:
        return jsonify({
            'error': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'error': f'Failed to update theme: {str(e)}'
        }), 500

@bp.route('/notifications', methods=['PATCH'])
@require_auth
def update_notification_settings():
    """Update user notification preferences."""
    try:
        user = get_current_user()
        settings = request.get_json()

        if not settings:
            return jsonify({
                'error': 'Settings not provided'
            }), 400

        preferences = preferences_service.update_notification_settings(user.id, settings)
        return jsonify(preferences)
    except Exception as e:
        return jsonify({
            'error': f'Failed to update notification settings: {str(e)}'
        }), 500

@bp.route('/accessibility', methods=['PATCH'])
@require_auth
def update_accessibility():
    """Update user accessibility preferences."""
    try:
        user = get_current_user()
        settings = request.get_json()

        if not settings:
            return jsonify({
                'error': 'Settings not provided'
            }), 400

        preferences = preferences_service.update_accessibility(user.id, settings)
        return jsonify(preferences)
    except Exception as e:
        return jsonify({
            'error': f'Failed to update accessibility settings: {str(e)}'
        }), 500

@bp.route('/dashboard', methods=['PATCH'])
@require_auth
def update_dashboard_layout():
    """Update user dashboard layout preferences."""
    try:
        user = get_current_user()
        layout = request.get_json()

        if not layout:
            return jsonify({
                'error': 'Layout not provided'
            }), 400

        preferences = preferences_service.update_dashboard_layout(user.id, layout)
        return jsonify(preferences)
    except Exception as e:
        return jsonify({
            'error': f'Failed to update dashboard layout: {str(e)}'
        }), 500

@bp.route('/localization', methods=['PATCH'])
@require_auth
def update_localization():
    """Update user localization preferences."""
    try:
        user = get_current_user()
        data = request.get_json()

        if not data or 'language' not in data or 'timezone' not in data:
            return jsonify({
                'error': 'Language and timezone required'
            }), 400

        preferences = preferences_service.update_localization(
            user.id,
            data['language'],
            data['timezone']
        )
        return jsonify(preferences)
    except Exception as e:
        return jsonify({
            'error': f'Failed to update localization: {str(e)}'
        }), 500
