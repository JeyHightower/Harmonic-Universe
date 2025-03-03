import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useModal } from '../../../contexts/ModalContext';
import UniverseFormModal from '../../../features/universe/UniverseFormModal';
import { checkAuthState, logout } from '../../../store/slices/authSlice';
import { resetState } from '../../../store/slices/universeSlice';
import { fetchUniverses } from '../../../store/thunks/universeThunks';
import Button from '../../common/Button';
import Spinner from '../../common/Spinner';
import './Dashboard.css';

function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { openModalByType } = useModal();
  const {
    universes,
    loading: universesLoading,
    error,
    authError,
    sortBy,
    sortOrder,
  } = useSelector(state => state.universe);
  const { isAuthenticated, loading: authLoading } = useSelector(
    state => state.auth
  );

  // State for direct modal rendering
  const [showUniverseModal, setShowUniverseModal] = useState(false);
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
    if (authLoading) return;

    const controller = new AbortController();

    const fetchData = async () => {
      if (isAuthenticated) {
        try {
          await dispatch(fetchUniverses({ signal: controller.signal }));
        } catch (error) {
          console.error('Error fetching universes:', error);
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
    console.log('Create Universe button clicked');

    // Use direct modal rendering instead of the modal system
    setShowUniverseModal(true);
  }, []);

  const handleModalClose = useCallback(() => {
    console.log('Closing create universe modal');
    setShowUniverseModal(false);
  }, []);

  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    dispatch(checkAuthState());
  }, [dispatch]);

  // Handle sorting
  const handleSort = useCallback(
    newSortBy => {
      dispatch(
        setSortOptions({
          sortBy: newSortBy,
          sortOrder:
            sortBy === newSortBy && sortOrder === 'asc' ? 'desc' : 'asc',
        })
      );
    },
    [dispatch, sortBy, sortOrder]
  );

  // Render loading state
  if (authLoading) {
    return (
      <div className="dashboard-loading">
        <Spinner size="large" />
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  // Render authentication error
  if (authError) {
    return (
      <div className="dashboard-error">
        <h2>Authentication Error</h2>
        <p>{authError}</p>
        <Button onClick={handleRetry}>Retry</Button>
      </div>
    );
  }

  // Render not authenticated state
  if (!isAuthenticated) {
    return (
      <div className="dashboard-not-authenticated">
        <h2>Please Log In</h2>
        <p>You need to be logged in to view your dashboard.</p>
        <Button onClick={() => navigate('/login')}>Log In</Button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Your Universes</h1>
        <Button onClick={handleCreateClick} variant="primary">
          Create Universe
        </Button>
      </header>

      <section className="universes-list">
        {universesLoading ? (
          <Spinner />
        ) : error ? (
          <div className="error-message">
            <p>{error}</p>
            <Button onClick={handleRetry}>Retry</Button>
          </div>
        ) : universes.length === 0 ? (
          <div className="empty-state">
            <h2>No Universes Found</h2>
            <p>Create your first universe to get started!</p>
            <Button onClick={handleCreateClick} variant="primary">
              Create Universe
            </Button>
          </div>
        ) : (
          <>
            <div className="sort-controls">
              <span>Sort by:</span>
              <button
                className={`sort-button ${sortBy === 'name' ? 'active' : ''}`}
                onClick={() => handleSort('name')}
              >
                Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
              <button
                className={`sort-button ${
                  sortBy === 'createdAt' ? 'active' : ''
                }`}
                onClick={() => handleSort('createdAt')}
              >
                Date{' '}
                {sortBy === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
            </div>

            <div className="universes-grid">
              {universes.map(universe => (
                <div
                  key={universe.id}
                  className="universe-card"
                  onClick={() => navigate(`/universes/${universe.id}`)}
                >
                  <h3>{universe.name}</h3>
                  <p>{universe.description}</p>
                  <div className="universe-meta">
                    <span className="universe-theme">{universe.theme}</span>
                    <span className="universe-visibility">
                      {universe.visibility}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Render the UniverseFormModal directly when showUniverseModal is true */}
      {showUniverseModal && (
        <UniverseFormModal onClose={handleModalClose} isGlobalModal={false} />
      )}
    </div>
  );
}

export default Dashboard;
