import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../routes';
import { checkAuthState, loginSuccess } from '../../../store/slices/authSlice';
import {
  fetchUniversesFailure,
  fetchUniversesStart,
  fetchUniversesSuccess,
} from '../../../store/slices/universeSlice';
import { api, endpoints } from '../../../utils/api';
import Button from '../../common/Button';
import Spinner from '../../common/Spinner';
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

  const [isModalOpen, setModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);

  // Fetch initial data
  useEffect(() => {
    dispatch(checkAuthState());
  }, [dispatch]);

  // Handle authentication and data fetching
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
      return;
    }

    if (isAuthenticated && !authLoading && !user) {
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

    if (isAuthenticated && !authLoading && !universesLoading && !universes) {
      const fetchUniverses = async () => {
        try {
          dispatch(fetchUniversesStart());
          const response = await api.get(endpoints.universes.list);
          dispatch(fetchUniversesSuccess(response));
        } catch (error) {
          console.error('Failed to fetch universes:', error);
          const errorMessage =
            error.response?.data?.message || 'Failed to fetch universes';
          dispatch(fetchUniversesFailure(errorMessage));

          if (error.response?.status === 401) {
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

  // Modal handlers
  const handleModalClose = useCallback(e => {
    if (e?.target?.classList?.contains('modal-overlay')) {
      setModalOpen(false);
    }
  }, []);

  const handleEscapeKey = useCallback(e => {
    if (e.key === 'Escape') {
      setModalOpen(false);
    }
  }, []);

  const handleTabKey = useCallback(e => {
    if (!modalRef.current) return;

    const focusableElements = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  }, []);

  // Modal focus management
  useEffect(() => {
    if (isModalOpen) {
      previousFocusRef.current = document.activeElement;
      document.addEventListener('keydown', handleEscapeKey);
      document.addEventListener('keydown', handleTabKey);

      if (modalRef.current) {
        const focusableElement = modalRef.current.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        focusableElement?.focus();
      }
    } else {
      document.removeEventListener('keydown', handleEscapeKey);
      document.removeEventListener('keydown', handleTabKey);
      previousFocusRef.current?.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.removeEventListener('keydown', handleTabKey);
    };
  }, [isModalOpen, handleEscapeKey, handleTabKey]);

  const handleCreateUniverse = useCallback(() => {
    setIsCreating(true);
  }, []);

  const handleKeyDown = useCallback(
    (e, universeId) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        navigate(`/universes/${universeId}`);
      }
    },
    [navigate]
  );

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
          <small>There was an error loading your universes.</small>
          <Button onClick={() => window.location.reload()}>Retry</Button>
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
        <Button
          as={Link}
          to={ROUTES.UNIVERSE_CREATE}
          onClick={handleCreateUniverse}
          disabled={isCreating || !user}
          loading={isCreating}
        >
          Create Universe
        </Button>
      </header>

      <section className="dashboard-section">
        <h2>Your Universes</h2>
        {!universes || universes.length === 0 ? (
          <div className="dashboard-empty" role="status">
            <p>You haven't created any universes yet.</p>
            <Button
              onClick={() => setModalOpen(true)}
              disabled={isCreating}
              loading={isCreating}
            >
              Create Your First Universe
            </Button>
          </div>
        ) : (
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
        )}
      </section>

      {isModalOpen && (
        <>
          <div
            className="modal-overlay"
            onClick={handleModalClose}
            aria-hidden="true"
          />
          <div
            className="modal"
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className="modal-header">
              <h2 id="modal-title">Create Your First Universe</h2>
              <button
                className="modal-close"
                onClick={() => setModalOpen(false)}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            <p>Click the button below to get started!</p>
            <div className="modal-actions">
              <Button
                as={Link}
                to={ROUTES.UNIVERSE_CREATE}
                onClick={() => {
                  setModalOpen(false);
                  handleCreateUniverse();
                }}
                disabled={isCreating}
                loading={isCreating}
              >
                Create Universe
              </Button>
              <Button
                onClick={() => setModalOpen(false)}
                variant="secondary"
                disabled={isCreating}
              >
                Close
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;
