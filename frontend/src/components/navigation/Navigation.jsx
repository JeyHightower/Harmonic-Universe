import { useCallback, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import logoSvg from '../../assets/logo.svg';
import { MODAL_TYPES } from '../../constants/modalTypes';
import { useModalRedux } from '../../hooks/useModal';
import { authService } from '../../services/auth.service.mjs';
import { logout } from '../../store/thunks/authThunks';
import './Navigation.css';

function Navigation() {
  const { open } = useModalRedux();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [isProcessing, setIsProcessing] = useState(false);
  const timeoutRef = useRef(null);

  const handleLoginClick = useCallback(
    (e) => {
      e.preventDefault();

      // Prevent multiple clicks
      if (isProcessing) return;

      setIsProcessing(true);
      console.log('[Navigation] Opening login modal');

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Add a small delay before attempting to open modal
      timeoutRef.current = setTimeout(() => {
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

        // Reset processing state after a delay
        setTimeout(() => setIsProcessing(false), 300);
      }, 50);
    },
    [open, isProcessing]
  );

  const handleSignupClick = useCallback(
    (e) => {
      e.preventDefault();

      // Prevent multiple clicks
      if (isProcessing) return;

      setIsProcessing(true);
      console.log('[Navigation] Opening signup modal');

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Add a small delay before attempting to open modal
      timeoutRef.current = setTimeout(() => {
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

        // Reset processing state after a delay
        setTimeout(() => setIsProcessing(false), 300);
      }, 50);
    },
    [open, isProcessing]
  );

  const handleLogout = useCallback(
    (e) => {
      e.preventDefault();
      console.log('[Navigation] Logging out user');
      authService.clearAuthData();
      dispatch(logout());
      navigate('/');
    },
    [dispatch, navigate]
  );

  const handleDashboardClick = useCallback(
    (e) => {
      e.preventDefault();
      console.log('[Navigation] Navigating to dashboard');
      navigate('/dashboard');
    },
    [navigate]
  );

  const handleLogoClick = (e) => {
    e.preventDefault(); // Prevent default link behavior
    console.log('[Navigation] Navigating to home');
    navigate('/'); // Navigate programmatically
  };

  return (
    <nav className="navigation" role="navigation" aria-label="Main Navigation">
      <div className="navigation-left">
        <Link
          to="/"
          className="logo-link"
          onClick={handleLogoClick} // Call the defined function here
        >
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
            <button
              type="button"
              onClick={handleLoginClick}
              className="nav-button"
              style={{ pointerEvents: 'auto' }}
              disabled={isProcessing}
            >
              Login
            </button>
            <button
              type="button"
              onClick={handleSignupClick}
              className="nav-button"
              style={{ pointerEvents: 'auto' }}
              disabled={isProcessing}
            >
              Sign Up
            </button>
          </>
        ) : (
          <>
            <span className="welcome-message">
              Hello, {user?.username || user?.firstName || 'User '}
            </span>
            <button
              type="button"
              onClick={handleDashboardClick}
              className="nav-button"
              style={{ pointerEvents: 'auto' }}
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="nav-button"
              style={{ pointerEvents: 'auto' }}
            >
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navigation;
