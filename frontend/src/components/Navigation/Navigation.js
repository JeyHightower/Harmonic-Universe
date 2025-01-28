import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { logout } from '../../redux/slices/authSlice';
import NotificationBell from '../Notifications/NotificationBell';
import styles from './Navigation.module.css';

const Navigation = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector(state => state.auth);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <nav className={styles.navigation}>
      <div className={styles.logo}>
        <Link to="/">Harmonic Universe</Link>
      </div>
      <div className={styles.navLinks}>
        {isAuthenticated ? (
          <>
            <Link to="/universes" className={styles.navLink}>
              My Universes
            </Link>
            <Link to="/templates" className={styles.navLink}>
              Templates
            </Link>
            <Link to="/explore" className={styles.navLink}>
              Explore
            </Link>
            <NotificationBell />
            <div className={styles.userMenu}>
              <span className={styles.username}>{user?.username}</span>
              <button onClick={handleLogout} className={styles.logoutButton}>
                Logout
              </button>
            </div>
          </>
        ) : (
          <>
            <Link to="/login" className={styles.navLink}>
              Login
            </Link>
            <Link to="/register" className={styles.navLink}>
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
