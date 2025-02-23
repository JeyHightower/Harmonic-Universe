import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { checkAuthState, loginSuccess } from '../../../store/slices/authSlice';
import {
  fetchUniversesFailure,
  fetchUniversesStart,
  fetchUniversesSuccess,
} from '../../../store/slices/universeSlice';
import { api, endpoints } from '../../../utils/api';
import Button from '../../common/Button';
import './Dashboard.css';

function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    universes,
    loading: universesLoading,
    error,
  } = useSelector(state => state.universe);
  const {
    user,
    isAuthenticated,
    loading: authLoading,
  } = useSelector(state => state.auth);

  console.log('user', user);

  useEffect(() => {
    console.debug('Dashboard mounted, checking auth state');
    dispatch(checkAuthState());
  }, [dispatch]);

  useEffect(() => {
    console.debug('Auth state changed:', {
      isAuthenticated,
      authLoading,
      user,
    });

    // Only redirect if we're sure about the authentication state
    if (!authLoading && !isAuthenticated) {
      console.debug('Not authenticated, redirecting to login');
      navigate('/login');
      return;
    }

    // If authenticated but no user data, fetch it
    if (isAuthenticated && !authLoading && !user) {
      console.debug('Authenticated but no user data, fetching user info');
      const fetchUserInfo = async () => {
        try {
          const response = await api.get(endpoints.auth.me);
          dispatch(loginSuccess(response));
        } catch (error) {
          console.error('Failed to fetch user info:', error);
          if (error.response?.status === 401) {
            navigate('/login');
          }
        }
      };
      fetchUserInfo();
    }

    // Only fetch universes if authenticated and not loading
    if (isAuthenticated && !authLoading && !universesLoading && !universes) {
      console.debug('Fetching universes');
      const fetchUniverses = async () => {
        try {
          dispatch(fetchUniversesStart());
          const response = await api.get(endpoints.universes.list);
          console.debug('Universes fetched successfully:', response);
          dispatch(fetchUniversesSuccess(response));
        } catch (error) {
          console.error('Failed to fetch universes:', error);
          let errorMessage = 'Failed to fetch universes';
          if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
          }
          dispatch(fetchUniversesFailure(errorMessage));

          // If unauthorized, redirect to login
          if (error.response?.status === 401) {
            console.debug('Unauthorized, redirecting to login');
            navigate('/login');
          }
        }
      };

      fetchUniverses();
    }
  }, [
    dispatch,
    isAuthenticated,
    authLoading,
    universesLoading,
    universes,
    navigate,
    user,
  ]);

  console.debug('Rendering Dashboard:', {
    authLoading,
    isAuthenticated,
    universesLoading,
    error,
    universes,
  });

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-loading">
          <p>Checking authentication...</p>
          <small>Please wait while we verify your session.</small>
        </div>
      </div>
    );
  }

  // Will be redirected by useEffect if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-loading">
          <p>Redirecting to login...</p>
          <small>You must be logged in to view this page.</small>
        </div>
      </div>
    );
  }

  if (universesLoading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-loading">
          <p>Loading universes...</p>
          <small>Please wait while we fetch your universes.</small>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-error">
          <p>{error}</p>
          <small>There was an error loading your universes.</small>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Welcome, {user?.username || 'User'}</h1>
        <Button as={Link} to="/universes/create">
          Create Universe
        </Button>
      </header>

      <section className="dashboard-section">
        <h2>Your Universes</h2>
        {!universes || universes.length === 0 ? (
          <div className="dashboard-empty">
            <p>You haven't created any universes yet.</p>
            <Button as={Link} to="/universes/create">
              Create Your First Universe
            </Button>
          </div>
        ) : (
          <div className="universe-grid">
            {universes.map(universe => (
              <Link
                key={universe.id}
                to={`/universes/${universe.id}`}
                className="universe-card"
              >
                <h3>{universe.name}</h3>
                <p>{universe.description}</p>
                <div className="universe-card-footer">
                  <span>
                    Created:{' '}
                    {new Date(
                      universe.created_at || Date.now()
                    ).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Dashboard;
