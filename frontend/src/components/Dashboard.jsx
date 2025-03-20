import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../routes';
import {
  checkAuthState,
  loginSuccess,
  logout,
} from '../../../store/slices/authSlice';
import {
  clearError,
  resetState,
  setSortBy,
  setSortOrder,
  sortUniverses,
} from '../../../store/slices/universeSlice';
import { fetchUniverses } from '../../../store/thunks/universeThunks';
import { api, endpoints } from '../../../utils/api';
import Button from '../../common/Button';
import Modal from '../../common/Modal';
import Spinner from '../../common/Spinner';
import './Dashboard.css';

function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    universes,
    loading: universesLoading,
    error,
    authError,
    sortBy,
    sortOrder,
  } = useSelector(state => state.universe);
  const {
    user,
    isAuthenticated,
    loading: authLoading,
  } = useSelector(state => state.auth);

  const [isModalOpen, setModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Reset state when component unmounts
  useEffect(() => {
    return () => {
      dispatch(resetState());
    };
  }, [dispatch]);

  // Fetch initial data
  useEffect(() => {
    console.debug('Checking auth state...');
    dispatch(checkAuthState());
  }, [dispatch]);

  // Handle authentication and data fetching
  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      if (!isAuthenticated || authLoading) {
        return;
      }

      // Fetch user info if needed
      if (!user) {
        try {
          console.debug('Fetching user info...');
          const response = await api.get(endpoints.auth.me);
          dispatch(loginSuccess(response));
        } catch (error) {
          console.error('Failed to fetch user info:', error);
          if (
            error.response?.status === 401 ||
            error.response?.status === 403
          ) {
            dispatch(logout());
            dispatch(resetState());
            navigate('/login');
          }
          return;
        }
      }

      // Only fetch universes if we haven't tried too many times
      if (!universesLoading && retryCount < 3) {
        try {
          console.debug('Fetching universes...', { retryCount });
          await dispatch(fetchUniverses()).unwrap();
          console.debug('Universes fetched successfully');
          setRetryCount(0);
        } catch (error) {
          console.error('Failed to fetch universes:', error);
          setRetryCount(prev => prev + 1);
          if (
            error.response?.status === 401 ||
            error.response?.status === 403
          ) {
            dispatch(logout());
            dispatch(resetState());
            navigate('/login');
          }
        }
      }
    };

    fetchData();

    return () => {
      controller.abort();
    };
  }, [isAuthenticated, authLoading]); // Only depend on auth state

  // Reset retry count when auth state changes
  useEffect(() => {
    if (isAuthenticated) {
      setRetryCount(0);
    }
  }, [isAuthenticated]);

  const handleCreateClick = useCallback(() => {
    setModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setModalOpen(false);
  }, []);

  const handleCreateConfirm = useCallback(() => {
    setIsCreating(true);
    setModalOpen(false);
    navigate(ROUTES.UNIVERSE_CREATE);
  }, [navigate]);

  const handleRetry = useCallback(() => {
    dispatch(clearError());
    setRetryCount(0);
    dispatch(fetchUniverses());
  }, [dispatch]);

  const handleKeyDown = useCallback(
    (e, universeId) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        navigate(`/universes/${universeId}`);
      }
    },
    [navigate]
  );

  const handleSortChange = event => {
    const [newSortBy, newSortOrder] = event.target.value.split('-');
    dispatch(setSortBy(newSortBy));
    dispatch(setSortOrder(newSortOrder));
    dispatch(sortUniverses());
  };

  if (authLoading) {
    return (
      <div className="dashboard-container" role="status">
        <div className="dashboard-loading">
          <Spinner size="large" />
          <p>Checking authentication...</p>
          <small>Please wait while we verify your session.</small>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="dashboard-container" role="status">
        <div className="dashboard-loading">
          <Spinner size="large" />
          <p>Redirecting to login...</p>
          <small>You must be logged in to view this page.</small>
        </div>
      </div>
    );
  }

  if (universesLoading) {
    return (
      <div className="dashboard-container" role="status">
        <div className="dashboard-loading">
          <Spinner size="large" />
          <p>Loading universes...</p>
          <small>Please wait while we fetch your universes.</small>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container" role="alert">
        <div className="dashboard-error">
          <p>{error}</p>
          <small>
            {authError
              ? 'Please log in again to continue.'
              : 'There was an error loading your universes.'}
          </small>
          <Button
            onClick={authError ? () => navigate('/login') : handleRetry}
            variant={authError ? 'primary' : 'secondary'}
          >
            {authError ? 'Log In' : 'Retry'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>
          Welcome,{' '}
          {user?.username || (
            <span className="loading-text">
              <Spinner size="small" />
              Loading...
            </span>
          )}
        </h1>
        <div className="dashboard-actions">
          {universes && universes.length > 0 && (
            <select
              className="sort-select"
              value={`${sortBy}-${sortOrder}`}
              onChange={handleSortChange}
              aria-label="Sort universes"
            >
              <option value="updated_at-desc">Recently Updated</option>
              <option value="updated_at-asc">Oldest Updated</option>
              <option value="created_at-desc">Recently Created</option>
              <option value="created_at-asc">Oldest Created</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="is_public-desc">Public First</option>
              <option value="is_public-asc">Private First</option>
            </select>
          )}
          <Button onClick={handleCreateClick} disabled={isCreating || !user}>
            Create Universe
          </Button>
        </div>
      </header>

      <section className="dashboard-section">
        {!universes || universes.length === 0 ? (
          <div className="dashboard-empty" role="status">
            <h2>Welcome to Your Universe Dashboard</h2>
            <p>
              You haven't created any universes yet. Start your journey by
              creating your first universe!
            </p>
            <Button
              onClick={handleCreateClick}
              disabled={isCreating}
              loading={isCreating}
              variant="primary"
            >
              Create Your First Universe
            </Button>
          </div>
        ) : (
          <>
            <h2>Your Universes</h2>
            <div className="universe-grid" role="grid">
              {universes.map(universe => (
                <Link
                  key={universe.id}
                  to={`/universes/${universe.id}`}
                  className="universe-card"
                  role="gridcell"
                  tabIndex="0"
                  onKeyDown={e => handleKeyDown(e, universe.id)}
                  aria-label={`Universe: ${universe.name}`}
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
          </>
        )}
      </section>

      <Modal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title="Create Your First Universe"
      >
        <div className="modal-content">
          <p>Click the button below to get started!</p>
          <div className="modal-actions">
            <Button
              onClick={handleCreateConfirm}
              disabled={isCreating}
              loading={isCreating}
            >
              Create Universe
            </Button>
            <Button
              onClick={handleModalClose}
              variant="secondary"
              disabled={isCreating}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default Dashboard;
