import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { logout } from '../store/slices/authSlice';
import { openModal } from '../store/slices/modalSlice';

function Layout({ children }) {
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
          <Link to="/" className="logo">
            Harmonic Universe
          </Link>
          <div className="nav-links">
            {isAuthenticated ? (
              <>
                <Link to="/">Dashboard</Link>
                <Link to="/profile">Profile</Link>
                <button onClick={handleLogout} className="nav-button">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login">Login</Link>
                <Link to="/register">Register</Link>
              </>
            )}
          </div>
        </nav>
      </header>
      <main className="main-content">{children}</main>
      <footer className="footer">
        <p>&copy; 2024 Harmonic Universe. All rights reserved.</p>
      </footer>
      <style jsx>{`
        .nav-button {
          background: none;
          border: none;
          color: var(--text-color);
          padding: 0.5rem 1rem;
          cursor: pointer;
          font-size: 1rem;
        }

        .nav-button:hover {
          background-color: var(--background-color);
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}

export default Layout;
