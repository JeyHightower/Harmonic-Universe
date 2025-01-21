import { formatDistanceToNow } from 'date-fns';
import React from 'react';
import styles from './NotificationItem.module.css';

const NotificationItem = ({ notification, onMarkAsRead, onDelete }) => {
  const { id, type, message, metadata, read, created_at } = notification;

  const getTypeIcon = () => {
    switch (type) {
      case 'system':
        return '🔧';
      case 'alert':
        return '⚠️';
      case 'message':
        return '💬';
      default:
        return '📢';
    }
  };

  const getTypeClass = () => {
    switch (type) {
      case 'system':
        return styles.system;
      case 'alert':
        return styles.alert;
      case 'message':
        return styles.message;
      default:
        return '';
    }
  };

  const handleMarkAsRead = e => {
    e.stopPropagation();
    if (!read) {
      onMarkAsRead(id);
    }
  };

  const handleDelete = e => {
    e.stopPropagation();
    onDelete(id);
  };

  return (
    <div
      className={`${styles.notification} ${
        !read ? styles.unread : ''
      } ${getTypeClass()}`}
      onClick={handleMarkAsRead}
    >
      <div className={styles.icon}>{getTypeIcon()}</div>

      <div className={styles.content}>
        <div className={styles.message}>{message}</div>

        {metadata && Object.keys(metadata).length > 0 && (
          <div className={styles.metadata}>
            {Object.entries(metadata).map(([key, value]) => (
              <span key={key} className={styles.metadataItem}>
                {key}: {value}
              </span>
            ))}
          </div>
        )}

        <div className={styles.timestamp}>
          {formatDistanceToNow(new Date(created_at), { addSuffix: true })}
        </div>
      </div>

      <div className={styles.actions}>
        {!read && (
          <button
            className={styles.markRead}
            onClick={handleMarkAsRead}
            title="Mark as read"
          >
            ✓
          </button>
        )}
        <button className={styles.delete} onClick={handleDelete} title="Delete">
          ×
        </button>
      </div>
    </div>
  );
};

export default NotificationItem;
