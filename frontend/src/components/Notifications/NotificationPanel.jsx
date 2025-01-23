import PropTypes from 'prop-types';
import React from 'react';
import { useDispatch } from 'react-redux';
import {
  deleteNotification,
  markAsRead,
} from '../../store/slices/notificationSlice';
import styles from './Notifications.module.css';

const NotificationPanel = ({ notifications, onClose }) => {
  const dispatch = useDispatch();

  const handleMarkAsRead = notificationId => {
    dispatch(markAsRead(notificationId));
  };

  const handleDelete = notificationId => {
    dispatch(deleteNotification(notificationId));
  };

  const formatDate = dateString => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getNotificationIcon = type => {
    switch (type) {
      case 'share':
        return '🔗';
      case 'comment':
        return '💬';
      case 'favorite':
        return '⭐';
      default:
        return '📢';
    }
  };

  if (notifications.length === 0) {
    return <div className={styles.emptyNotifications}>No notifications</div>;
  }

  return (
    <div className={styles.notificationList}>
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`${styles.notificationItem} ${
            !notification.read ? styles.unread : ''
          }`}
          onClick={() => {
            if (!notification.read) {
              handleMarkAsRead(notification.id);
            }
            if (notification.link) {
              onClose();
              // Navigate to the link
            }
          }}
        >
          <div className={styles.notificationIcon}>
            {getNotificationIcon(notification.type)}
          </div>
          <div className={styles.notificationContent}>
            <p className={styles.notificationText}>{notification.message}</p>
            <span className={styles.notificationTime}>
              {formatDate(notification.created_at)}
            </span>
          </div>
          <button
            className={styles.deleteButton}
            onClick={e => {
              e.stopPropagation();
              handleDelete(notification.id);
            }}
            title="Delete notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

NotificationPanel.propTypes = {
  notifications: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      type: PropTypes.string.isRequired,
      message: PropTypes.string.isRequired,
      read: PropTypes.bool.isRequired,
      created_at: PropTypes.string.isRequired,
      link: PropTypes.string,
    })
  ).isRequired,
  onClose: PropTypes.func.isRequired,
};

export default NotificationPanel;
