import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { logout } from '../../store/slices/authSlice';
import './Navigation.css';

const Navigation = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector(state => state.auth);

  const handleLogout = async () => {
    await authService.logout();
    dispatch(logout());
    navigate('/login');
  };

  if (!isAuthenticated) return null;

  return (
    <nav className="navigation">
      <div className="nav-content">
        <Link to="/dashboard" className="nav-logo">
          Harmonic Universe
        </Link>

        <div className="nav-links">
          <Link to="/dashboard" className="nav-link">
            Dashboard
          </Link>
          <Link to="/universe/create" className="nav-link">
            Create Universe
          </Link>
          <Link to="/audio" className="nav-link">
            Audio
          </Link>
        </div>

        <div className="nav-user">
          <Link to="/profile" className="nav-link">
            {user?.email || 'Profile'}
          </Link>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
