import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
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

  useEffect(() => {
    // Only redirect if we're sure about the authentication state
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
      return;
    }

    // Only fetch universes if authenticated
    if (isAuthenticated) {
      const fetchUniverses = async () => {
        try {
          dispatch(fetchUniversesStart());
          const response = await api.get(endpoints.universes.list);
          dispatch(fetchUniversesSuccess(response));
        } catch (error) {
          dispatch(fetchUniversesFailure(error.message));
        }
      };

      fetchUniverses();
    }
  }, [dispatch, isAuthenticated, authLoading, navigate]);

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-loading">Loading...</div>
      </div>
    );
  }

  // Will be redirected by useEffect if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  if (universesLoading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-loading">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-error">
          {error}
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
