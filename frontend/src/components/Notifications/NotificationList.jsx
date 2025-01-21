import React, { useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useSelector } from 'react-redux';
import NotificationItem from './NotificationItem';
import styles from './NotificationList.module.css';

const NotificationList = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const user = useSelector(state => state.auth.user);

  useEffect(() => {
    fetchNotifications();
  }, [page, typeFilter, unreadOnly, startDate, endDate]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        per_page: 20,
        unread: unreadOnly,
      });

      if (typeFilter) params.append('type', typeFilter);
      if (startDate) params.append('start_date', startDate.toISOString());
      if (endDate) params.append('end_date', endDate.toISOString());

      const response = await fetch(`/api/notifications?${params}`);
      if (!response.ok) throw new Error('Failed to fetch notifications');

      const data = await response.json();
      setNotifications(data.notifications);
      setTotalPages(data.pages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async notificationId => {
    try {
      const response = await fetch(
        `/api/notifications/${notificationId}/read`,
        {
          method: 'POST',
        }
      );
      if (!response.ok) throw new Error('Failed to mark notification as read');

      setNotifications(
        notifications.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'POST',
      });
      if (!response.ok)
        throw new Error('Failed to mark all notifications as read');

      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const handleDelete = async notificationId => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete notification');

      setNotifications(notifications.filter(n => n.id !== notificationId));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  if (loading)
    return <div className={styles.loading}>Loading notifications...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Notifications</h2>
        <button
          className={styles.markAllRead}
          onClick={handleMarkAllAsRead}
          disabled={notifications.every(n => n.read)}
        >
          Mark all as read
        </button>
      </div>

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>Type:</label>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
          >
            <option value="">All</option>
            <option value="system">System</option>
            <option value="alert">Alert</option>
            <option value="message">Message</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={e => setUnreadOnly(e.target.checked)}
            />
            Unread only
          </label>
        </div>

        <div className={styles.filterGroup}>
          <DatePicker
            selected={startDate}
            onChange={setStartDate}
            placeholderText="Start date"
            maxDate={endDate || new Date()}
            className={styles.datePicker}
          />
          <DatePicker
            selected={endDate}
            onChange={setEndDate}
            placeholderText="End date"
            minDate={startDate}
            maxDate={new Date()}
            className={styles.datePicker}
          />
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className={styles.empty}>No notifications found</div>
      ) : (
        <>
          <div className={styles.list}>
            {notifications.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
              />
            ))}
          </div>

          <div className={styles.pagination}>
            <button onClick={() => setPage(p => p - 1)} disabled={page === 1}>
              Previous
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationList;
