import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Navigation.module.css';

const Navigation = () => {
  return (
    <nav className={styles.navigation}>
      <div className={styles.logo}>
        <Link to="/">Harmonic Universe</Link>
      </div>
      <div className={styles.links}>
        <Link to="/" className={styles.link}>
          Home
        </Link>
        <Link to="/universes/new" className={styles.link}>
          Create Universe
        </Link>
        <Link to="/analytics" className={styles.link}>
          Analytics
        </Link>
        <Link to="/settings" className={styles.link}>
          Settings
        </Link>
        <Link to="/profile" className={styles.link}>
          Profile
        </Link>
      </div>
    </nav>
  );
};

export default Navigation;
