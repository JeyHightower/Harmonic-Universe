import { useDispatch, useSelector } from 'react-redux';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { logout } from '../../store/slices/authSlice';
import { openModal } from '../../store/slices/modalSlice';
import Logo from '../common/Logo';
import ThemeToggle from '../common/ThemeToggle';
import './Layout.css';

function Layout() {
  const { isAuthenticated } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(
      openModal({
        title: 'Confirm Logout',
        content: 'Are you sure you want to logout?',
        onConfirm: () => {
          dispatch(logout());
          navigate('/login');
        },
      })
    );
  };

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
                <button onClick={handleLogout} className="nav-button">
                  Logout
                </button>
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
    </div>
  );
}

export default Layout;
