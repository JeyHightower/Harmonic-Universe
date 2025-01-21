import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchNotifications,
  markAllAsRead,
} from '../../redux/slices/notificationSlice';
import NotificationPanel from './NotificationPanel';
import styles from './Notifications.module.css';

const NotificationBell = () => {
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const bellRef = useRef(null);
  const { notifications, unreadCount } = useSelector(
    state => state.notifications
  );

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  useEffect(() => {
    const handleClickOutside = event => {
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBellClick = () => {
    setIsOpen(!isOpen);
  };

  const handleMarkAllRead = () => {
    dispatch(markAllAsRead());
  };

  return (
    <div className={styles.notificationBell} ref={bellRef}>
      <button
        className={styles.bellButton}
        onClick={handleBellClick}
        title="Notifications"
      >
        <span className={styles.bellIcon}>🔔</span>
        {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className={styles.notificationContainer}>
          <div className={styles.notificationHeader}>
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className={styles.markAllRead}
              >
                Mark all as read
              </button>
            )}
          </div>
          <NotificationPanel
            notifications={notifications}
            onClose={() => setIsOpen(false)}
          />
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
