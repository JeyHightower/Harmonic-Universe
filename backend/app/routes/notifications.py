from datetime import datetime
from flask import Blueprint, jsonify, request
from app.services.notification import notification_service
from app.auth import require_auth, get_current_user
from app.models import Notification
from app.extensions import db
from app import socketio

notifications_bp = Blueprint('notifications', __name__, url_prefix='/api/notifications')

# Mock database for testing
notifications_db = {}

@notifications_bp.route('/', methods=['GET', 'POST'])
def handle_notifications():
    if request.method == 'GET':
        return jsonify(list(notifications_db.values()))

    data = request.get_json()
    notification_id = len(notifications_db) + 1
    new_notification = {
        "id": notification_id,
        "type": data['type'],
        "message": data['message'],
        "isRead": False,
        "createdAt": datetime.now().isoformat()
    }
    notifications_db[notification_id] = new_notification
    socketio.emit('notification', new_notification)
    return jsonify(new_notification), 201

@notifications_bp.route('/<int:notification_id>', methods=['PATCH', 'DELETE'])
def handle_notification(notification_id):
    notification = notifications_db.get(notification_id)
    if not notification:
        return jsonify({"error": "Notification not found"}), 404

    if request.method == 'PATCH':
        data = request.get_json()
        notification.update(data)
        return jsonify(notification)

    elif request.method == 'DELETE':
        del notifications_db[notification_id]
        return '', 204

@notifications_bp.route('/mark-all-read', methods=['POST'])
def mark_all_notifications_read():
    for notification in notifications_db.values():
        notification['isRead'] = True
    return jsonify(list(notifications_db.values()))

@notifications_bp.route('/cleanup', methods=['POST'])
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
