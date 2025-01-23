"""Notification service for handling user notifications."""
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from sqlalchemy import desc
from app.models import Notification
from app.extensions import db, cache

class NotificationService:
    """Service for handling user notifications."""

    def __init__(self):
        self.cache = cache
        self.cache_ttl = 300  # 5 minutes

    def create_notification(
        self,
        user_id: int,
        message: str,
        type: str = 'info',
        link: Optional[str] = None
    ) -> Notification:
        """
        Create a new notification.

        Args:
            user_id: ID of the user to notify
            message: Notification message
            type: Type of notification (info, warning, error)
            link: Optional link associated with notification

        Returns:
            Created notification
        """
        notification = Notification(
            user_id=user_id,
            message=message,
            type=type,
            link=link
        )
        notification.save()

        # Invalidate user's notification cache
        self._invalidate_cache(user_id)

        return notification

    def get_notifications(
        self,
        user_id: int,
        page: int = 1,
        per_page: int = 20,
        type_filter: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        unread_only: bool = False
    ) -> Dict:
        """Get notifications with filtering and pagination."""
        cache_key = f"notifications:{user_id}:{page}:{per_page}:{type_filter}:{start_date}:{end_date}:{unread_only}"

        # Try cache first
        cached = self.cache.get(cache_key)
        if cached:
            return cached

        # Build query
        query = Notification.query.filter_by(user_id=user_id)

        if type_filter:
            query = query.filter_by(type=type_filter)
        if unread_only:
            query = query.filter_by(read=False)
        if start_date:
            query = query.filter(Notification.created_at >= start_date)
        if end_date:
            query = query.filter(Notification.created_at <= end_date)

        # Get total count
        total = query.count()

        # Get paginated results
        paginated = query.order_by(Notification.created_at.desc())\
            .paginate(page=page, per_page=per_page)

        result = {
            'notifications': [n.to_dict() for n in paginated.items],
            'total': total,
            'pages': paginated.pages,
            'current_page': page
        }

        # Cache results
        self.cache.setex(cache_key, self.cache_ttl, result)

        return result

    def mark_as_read(self, notification_id: int) -> bool:
        """
        Mark a notification as read.

        Args:
            notification_id: ID of the notification

        Returns:
            True if successful, False otherwise
        """
        notification = Notification.query.get(notification_id)
        if notification:
            notification.read = True
            notification.read_at = datetime.utcnow()
            notification.save()

            # Invalidate cache
            self._invalidate_cache(notification.user_id)

            return True
        return False

    def mark_all_as_read(self, user_id: int) -> int:
        """
        Mark all notifications for a user as read.

        Args:
            user_id: ID of the user

        Returns:
            Number of notifications marked as read
        """
        now = datetime.utcnow()
        result = (
            Notification.query
            .filter_by(user_id=user_id, read=False)
            .update({
                'read': True,
                'read_at': now
            })
        )
        db.session.commit()

        # Invalidate cache
        self._invalidate_cache(user_id)

        return result

    def delete_notification(self, notification_id: int) -> bool:
        """
        Delete a notification.

        Args:
            notification_id: ID of the notification

        Returns:
            True if successful, False otherwise
        """
        notification = Notification.query.get(notification_id)
        if notification:
            notification.delete()

            # Invalidate cache
            self._invalidate_cache(notification.user_id)

            return True
        return False

    def delete_old_notifications(self, days: int = 30) -> int:
        """
        Delete notifications older than specified days.

        Args:
            days: Number of days to keep notifications

        Returns:
            Number of notifications deleted
        """
        cutoff = datetime.utcnow() - timedelta(days=days)
        result = (
            Notification.query
            .filter(Notification.created_at < cutoff)
            .delete()
        )
        db.session.commit()

        # Invalidate cache
        self._invalidate_cache(0)

        return result

    def _invalidate_cache(self, user_id: int):
        """Invalidate all cached notifications for a user."""
        pattern = f"notifications:{user_id}:*"
        keys = self.cache.keys(pattern)

        for key in keys:
            self.cache.delete(key)

notification_service = NotificationService()
