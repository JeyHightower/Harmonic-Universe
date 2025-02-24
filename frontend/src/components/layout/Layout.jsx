import { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { logout } from '../../store/slices/authSlice';
import { api, endpoints } from '../../utils/api';
import Button from '../common/Button';
import Logo from '../common/Logo';
import Modal from '../common/Modal';
import ThemeToggle from '../common/ThemeToggle';
import './Layout.css';

function Layout() {
  const { isAuthenticated } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState(null);

  const handleLogoutClick = e => {
    e.preventDefault();
    e.stopPropagation();
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = async () => {
    try {
      setIsLoggingOut(true);
      setError(null);

      // Call logout endpoint
      await api.post(endpoints.auth.logout);

      // Clear local storage and redux state
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      dispatch(logout());

      // Close modal and redirect
      setShowLogoutModal(false);
      navigate('/');
    } catch (error) {
      setError(error.message || 'Failed to logout');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleCloseModal = useCallback(
    e => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (!isLoggingOut) {
        setShowLogoutModal(false);
        setError(null);
      }
    },
    [isLoggingOut]
  );

  return (
    <div className="app">
      <header className="header">
        <nav>
          <Link to="/" className="logo-link">
            <div className="logo-container">
              <Logo size={32} />
              <span className="logo-text">Harmonic Universe</span>
            </div>
          </Link>
          <div className="nav-links">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard">Dashboard</Link>
                <ThemeToggle />
                <Button onClick={handleLogoutClick} variant="secondary">
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">Login</Link>
                <Link to="/register">Register</Link>
                <ThemeToggle />
              </>
            )}
          </div>
        </nav>
      </header>
      <main className="main-content">
        <Outlet />
      </main>
      <footer className="footer">
        <p>&copy; 2024 Harmonic Universe. All rights reserved.</p>
      </footer>

      <Modal
        isOpen={showLogoutModal}
        onClose={handleCloseModal}
        title="Confirm Logout"
      >
        <div className="modal-content">
          <p>Are you sure you want to logout?</p>
          {error && <div className="error-message">{error}</div>}
          <div className="modal-actions">
            <Button
              variant="primary"
              onClick={handleLogoutConfirm}
              disabled={isLoggingOut}
              loading={isLoggingOut}
            >
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </Button>
            <Button
              variant="secondary"
              onClick={handleCloseModal}
              disabled={isLoggingOut}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default Layout;
