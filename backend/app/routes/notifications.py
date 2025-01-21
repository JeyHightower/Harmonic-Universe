from datetime import datetime
from flask import Blueprint, jsonify, request
from app.services.notification import notification_service
from app.auth import require_auth, get_current_user

bp = Blueprint('notifications', __name__, url_prefix='/api/notifications')

@bp.route('/', methods=['GET'])
@require_auth
def get_notifications():
    """Get user's notifications with filtering and pagination."""
    try:
        user = get_current_user()
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        type_filter = request.args.get('type')
        unread_only = request.args.get('unread', '').lower() == 'true'

        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')

        if start_date:
            start_date = datetime.fromisoformat(start_date)
        if end_date:
            end_date = datetime.fromisoformat(end_date)

        result = notification_service.get_notifications(
            user_id=user.id,
            page=page,
            per_page=per_page,
            type_filter=type_filter,
            start_date=start_date,
            end_date=end_date,
            unread_only=unread_only
        )

        return jsonify(result)

    except ValueError as e:
        return jsonify({
            'error': f'Invalid parameter format: {str(e)}'
        }), 400
    except Exception as e:
        return jsonify({
            'error': f'Failed to fetch notifications: {str(e)}'
        }), 500

@bp.route('/<int:notification_id>/read', methods=['POST'])
@require_auth
def mark_as_read(notification_id):
    """Mark a notification as read."""
    try:
        user = get_current_user()
        success = notification_service.mark_as_read(notification_id, user.id)

        if not success:
            return jsonify({
                'error': 'Notification not found'
            }), 404

        return jsonify({'status': 'success'})

    except Exception as e:
        return jsonify({
            'error': f'Failed to mark notification as read: {str(e)}'
        }), 500

@bp.route('/read-all', methods=['POST'])
@require_auth
def mark_all_as_read():
    """Mark all notifications as read."""
    try:
        user = get_current_user()
        count = notification_service.mark_all_as_read(user.id)
        return jsonify({
            'status': 'success',
            'count': count
        })

    except Exception as e:
        return jsonify({
            'error': f'Failed to mark notifications as read: {str(e)}'
        }), 500

@bp.route('/<int:notification_id>', methods=['DELETE'])
@require_auth
def delete_notification(notification_id):
    """Delete a notification."""
    try:
        user = get_current_user()
        success = notification_service.delete_notification(notification_id, user.id)

        if not success:
            return jsonify({
                'error': 'Notification not found'
            }), 404

        return jsonify({'status': 'success'})

    except Exception as e:
        return jsonify({
            'error': f'Failed to delete notification: {str(e)}'
        }), 500

@bp.route('/cleanup', methods=['POST'])
@require_auth
def cleanup_notifications():
    """Clean up old notifications."""
    try:
        days = request.json.get('days', 90)
        notification_service.cleanup_old_notifications(days)
        return jsonify({'status': 'success'})
    except Exception as e:
        return jsonify({
            'error': f'Failed to clean up notifications: {str(e)}'
        }), 500
