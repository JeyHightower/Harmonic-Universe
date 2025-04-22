import React, { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useModal } from '../../contexts/ModalContext';
import { MODAL_TYPES } from '../../constants/modalTypes';
import { logout } from '../../store/thunks/authThunks';
import { authService } from '../../services/auth.service.mjs';
import logoSvg from '../../assets/logo.svg';
import './Navigation.css';

function Navigation() {
  const { open } = useModal();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const handleLoginClick = useCallback(() => {
    try {
      console.log('[Navigation] Opening login modal');
      open(MODAL_TYPES.LOGIN, {
        title: 'Login',
        size: 'medium',
        position: 'center',
        animation: 'fade',
        closeOnEscape: true,
        closeOnBackdrop: true,
        preventBodyScroll: true,
        showCloseButton: true,
      });
    } catch (error) {
      console.error('[Navigation] Error opening login modal:', error);
    }
  }, [open]);

  const handleSignupClick = useCallback(() => {
    try {
      console.log('[Navigation] Opening signup modal');
      open(MODAL_TYPES.SIGNUP, {
        title: 'Sign Up',
        size: 'medium',
        position: 'center',
        animation: 'fade',
        closeOnEscape: true,
        closeOnBackdrop: true,
        preventBodyScroll: true,
        showCloseButton: true,
      });
    } catch (error) {
      console.error('[Navigation] Error opening signup modal:', error);
    }
  }, [open]);

  const handleLogout = useCallback(() => {
    console.log('[Navigation] Logging out user');
    // Use the centralized auth service for consistent logout
    authService.clearAuthData();
    dispatch(logout());
  }, [dispatch]);

  return (
    <nav className="navigation">
      <div className="navigation-left">
        <Link to="/" className="logo-link">
          <img
            src={logoSvg}
            alt="Harmonic Universe Logo"
            className="navigation-logo"
            style={{ height: '40px', width: 'auto' }}
          />
        </Link>
      </div>
      <div className="navigation-right">
        {!isAuthenticated ? (
          <>
            <button onClick={handleLoginClick} className="nav-button">
              Login
            </button>
            <button onClick={handleSignupClick} className="nav-button">
              Sign Up
            </button>
          </>
        ) : (
          <>
            <span className="welcome-message">
              Hello, {user?.username || user?.firstName || 'User'}
            </span>
            <Link to="/dashboard" className="nav-button">
              Dashboard
            </Link>
            <button onClick={handleLogout} className="nav-button">
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navigation;
