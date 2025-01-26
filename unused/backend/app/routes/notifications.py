"""Notification routes."""
from flask import Blueprint, jsonify, request
from app.services.notification import notification_service
from app.utils.auth import require_auth
from flask_jwt_extended import get_jwt_identity

notifications_bp = Blueprint("notifications", __name__)


@notifications_bp.route("/notifications", methods=["GET"])
@require_auth
def get_notifications():
    """Get user notifications."""
    user_id = get_jwt_identity()
    limit = request.args.get("limit", 10, type=int)
    offset = request.args.get("offset", 0, type=int)
    unread_only = request.args.get("unread", False, type=bool)

    notifications = notification_service.get_user_notifications(
        user_id, limit=limit, offset=offset, unread_only=unread_only
    )

    return (
        jsonify(
            {
                "notifications": notifications,
                "total": len(notifications),
                "limit": limit,
                "offset": offset,
            }
        ),
        200,
    )


@notifications_bp.route("/notifications/<int:notification_id>", methods=["PUT"])
@require_auth
def mark_as_read(notification_id):
    """Mark a notification as read."""
    success = notification_service.mark_as_read(notification_id)

    if not success:
        return jsonify({"error": "Notification not found"}), 404

    return jsonify({"message": "Notification marked as read"}), 200


@notifications_bp.route("/notifications/mark-all-read", methods=["PUT"])
@require_auth
def mark_all_read():
    """Mark all notifications as read."""
    user_id = get_jwt_identity()
    count = notification_service.mark_all_as_read(user_id)

    return jsonify({"message": f"Marked {count} notifications as read"}), 200


@notifications_bp.route("/notifications/<int:notification_id>", methods=["DELETE"])
@require_auth
def delete_notification(notification_id):
    """Delete a notification."""
    success = notification_service.delete_notification(notification_id)

    if not success:
        return jsonify({"error": "Notification not found"}), 404

    return jsonify({"message": "Notification deleted"}), 200
