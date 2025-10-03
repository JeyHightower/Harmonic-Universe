import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { MODAL_TYPES } from '../../../constants/modalTypes';
import { useModalState } from '../../../hooks/useModalState';
import { checkAuthState, demoLogin } from '../../../store/thunks/authThunks';
import '../../../styles/Home.css';
import { AUTH_CONFIG } from '../../../utils/config';

// Destructure window.setTimeout to fix linter error
const { setTimeout } = window;

const  Home = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading, isDemoUser } = useSelector((state) => state.auth);
  const { openModal } = useModalState();

  useEffect(() => {
    console.debug('Home component mounted');
    // Only check auth state if we have a token
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    if (token) {
      dispatch(checkAuthState());
    }
  }, [dispatch]);

  useEffect(() => {
    console.debug('Auth state updated:', { isAuthenticated, loading });
    if (isAuthenticated && !loading) {
      console.debug('Redirecting to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  useEffect(() => {
    // Handle URL parameters for modals and demo login
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const modalParam = searchParams.get('modal');
      const demoParam = searchParams.get('demo');

      // Handle modal parameter
      if (modalParam && openModal) {
        if (modalParam === 'login') {
          openModal(MODAL_TYPES.LOGIN);
        } else if (modalParam === 'signup') {
          openModal(MODAL_TYPES.SIGNUP);
        }
      }

      // Handle demo parameter
      if (demoParam === 'true') {
        handleDemoLogin();
      }
    } catch (error) {
      console.error('[Home] Error handling URL parameters:', error);
    }
  }, []);

  const handleDemoLogin = async () => {
    console.error('Home - handleDemoLogin called');
    console.log('starting demo login');
    try {
      console.debug('[Home] Starting demo login process');
      console.error('Home - About to dispatch demoLogin');
      const result = await dispatch(demoLogin()).unwrap();
      console.error('Home - demoLogin result:', result);

      if (result?.success) {
        console.debug('[Home] Demo login successful');
        console.error('Home - Demo login successful, navigating to dashboard');
        navigate('/dashboard', { replace: true });
      } else {
        throw new Error('Demo login failed');
      }
    } catch (error) {
      console.error('[Home] Demo login process failed:', error);
      console.error('Home - Demo login error:', error);
    }
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleRegister = () => {
    navigate('/register');
  };

  const handleDashboard = () => {
    navigate('/dashboard');
  };

  const handleLogout = () => {
    // Clear auth state and redirect to home
    localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
    localStorage.removeItem(AUTH_CONFIG.USER_KEY);
    localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
    window.location.reload();
  };

  // Removed handleDemoUniverseCheck and related debug button

  console.debug('Rendering Home component:', { isAuthenticated, loading });

  if (loading) {
    return (
      <div className="home-container">
        <div className="loading">
          <p>Loading...</p>
          <small>Please wait while we check your session.</small>
        </div>
      </div>
    );
  }

  // If authenticated, the useEffect will handle redirect
  if (isAuthenticated) {
    return (
      <div className="home-container">
        <div className="loading">
          <p>Redirecting to dashboard...</p>
          <small>Please wait while we redirect you.</small>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <div className="home-content">
        <h1>Welcome to Harmonic Universe</h1>
        <p>Create, explore, and manage your creative universes</p>

        {!isAuthenticated ? (
          <div className="auth-buttons">
            <button onClick={handleLogin} className="btn btn-primary">
              Login
            </button>
            <button onClick={handleRegister} className="btn btn-secondary">
              Register
            </button>
            <button onClick={handleDemoLogin} className="btn btn-demo">
              Try Demo
            </button>
          </div>
        ) : (
          <div className="user-actions">
            <button onClick={handleDashboard} className="btn btn-primary">
              Go to Dashboard
            </button>
            <button onClick={handleLogout} className="btn btn-secondary">
              Logout
            </button>
            {isDemoUser && null}
          </div>
        )}
      </div>
      <div className="features-grid">
        <div className="feature-card">
          <h3>Create Universes</h3>
          <p>
            Design your own musical universes with unique physics parameters and sound profiles.
          </p>
        </div>
        <div className="feature-card">
          <h3>Interactive Physics</h3>
          <p>
            Experiment with 2D and 3D physics simulations that respond to your musical creations.
          </p>
        </div>
        <div className="feature-card">
          <h3>Sound Design</h3>
          <p>
            Craft beautiful soundscapes with our advanced audio generation and manipulation tools.
          </p>
        </div>
        <div className="feature-card">
          <h3>Visual Experience</h3>
          <p>Watch your music come to life with stunning visualizations and animations.</p>
        </div>
      </div>
    </div>
  );
}

export default Home;
