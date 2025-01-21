import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import { logout } from '../../store/session';
import './Navigation.css';

const Navigation = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector(state => state.session);

  const handleLogout = () => {
    dispatch(logout());
  };

  if (!isAuthenticated) return null;

  return (
    <nav className="navigation">
      <div className="nav-content">
        <div className="nav-brand">
          <Link to="/dashboard">Harmonic Universe</Link>
        </div>

        <div className="nav-links">
          <Link
            to="/dashboard"
            className={location.pathname === '/dashboard' ? 'active' : ''}
          >
            Dashboard
          </Link>
          <Link
            to="/universe/create"
            className={location.pathname === '/universe/create' ? 'active' : ''}
          >
            Create Universe
          </Link>
          <Link
            to="/audio"
            className={location.pathname === '/audio' ? 'active' : ''}
          >
            Audio Lab
          </Link>
        </div>

        <div className="nav-user">
          <Link
            to="/profile"
            className={location.pathname === '/profile' ? 'active' : ''}
          >
            {user?.username || 'Profile'}
          </Link>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
