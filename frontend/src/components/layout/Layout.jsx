import { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../routes';
import { logout } from '../../store/slices/authSlice';
import { api, endpoints } from '../../utils/api';
import Button from '../common/Button';
import Logo from '../common/Logo';
import ThemeToggle from '../common/ThemeToggle';
import './Layout.css';

function Layout() {
  const { isAuthenticated } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState(null);

  const handleLogoutClick = useCallback(e => {
    console.log('Logout button clicked');
    e.preventDefault();
    setShowLogoutModal(true);
    console.log('Modal state set to:', true);
  }, []);

  const handleLogoutConfirm = async () => {
    try {
      console.log('Logout process started');
      setIsLoggingOut(true);
      setError(null);

      // Call logout endpoint
      console.log('Calling logout endpoint:', endpoints.auth.logout);
      const response = await api.post(endpoints.auth.logout);
      console.log('Logout API response:', response);

      // Clear local storage and redux state
      console.log('Clearing local storage tokens');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');

      console.log('Dispatching logout action');
      dispatch(logout());

      // Close modal and redirect
      console.log('Closing modal and redirecting to home');
      setShowLogoutModal(false);
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
      setError(error.message || 'Failed to logout');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleCloseModal = useCallback(() => {
    if (!isLoggingOut) {
      setShowLogoutModal(false);
      setError(null);
    }
  }, [isLoggingOut]);

  const handleModalContentClick = useCallback(e => {
    // Only stop propagation for the logout modal content
    if (e.currentTarget.classList.contains('logout-modal-content')) {
      e.stopPropagation();
    }
  }, []);

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
                <Link to={ROUTES.SETTINGS}>Settings</Link>
                <ThemeToggle />
                <Button onClick={handleLogoutClick} variant="secondary">
                  Logout
                </Button>
                {/* Debug modal state */}
                <span style={{ fontSize: '0.8rem', marginLeft: '10px' }}>
                  Modal: {showLogoutModal ? 'Open' : 'Closed'}
                </span>
              </>
            ) : (
              <>
                <Link to="/login">Login</Link>
                <Link to="/register">Register</Link>
                <Link to={ROUTES.SETTINGS}>Settings</Link>
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

      {/* Debug modal state before rendering Modal */}
      {console.log(
        'Before rendering Modal, showLogoutModal state:',
        showLogoutModal
      )}

      {/* Custom simple modal implementation */}
      {showLogoutModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={handleCloseModal}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              width: '400px',
              maxWidth: '90%',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to logout?</p>
            {error && (
              <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>
            )}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                marginTop: '20px',
              }}
            >
              <button
                onClick={() => {
                  console.log('Custom modal: Confirm button clicked');
                  handleLogoutConfirm();
                }}
                disabled={isLoggingOut}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isLoggingOut ? 'not-allowed' : 'pointer',
                  opacity: isLoggingOut ? 0.7 : 1,
                }}
              >
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </button>
              <button
                onClick={() => {
                  console.log('Custom modal: Cancel button clicked');
                  handleCloseModal();
                }}
                disabled={isLoggingOut}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isLoggingOut ? 'not-allowed' : 'pointer',
                  opacity: isLoggingOut ? 0.7 : 1,
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Original Modal component (commented out for testing) */}
      {/* <Modal
        isOpen={showLogoutModal}
        onClose={handleCloseModal}
        title="Confirm Logout"
      >
        <div className="logout-modal-content" onClick={handleModalContentClick}>
          <p>Are you sure you want to logout?</p>
          {error && <div className="error-message">{error}</div>}
          <div className="logout-modal-actions">
            <Button
              variant="primary"
              onClick={() => {
                console.log('Confirm button clicked in modal');
                handleLogoutConfirm();
              }}
              disabled={isLoggingOut}
              loading={isLoggingOut}
            >
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                console.log('Cancel button clicked in modal');
                handleCloseModal();
              }}
              disabled={isLoggingOut}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal> */}
    </div>
  );
}

export default Layout;
