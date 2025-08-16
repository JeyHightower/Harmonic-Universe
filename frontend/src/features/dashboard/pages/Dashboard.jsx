import {
  Add as AddIcon,
  Logout as LogoutIcon,
  Refresh as RefreshIcon,
  RestartAlt as ResetIcon,
} from '@mui/icons-material';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Tooltip,
  Typography,
} from '@mui/material';
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

// Import the UniverseCard from features/universe
import { UniverseCard } from '../../universe';
const UniverseModal = lazy(() => import('../../universe/modals/UniverseModal'));

import { authService } from '../../../services/auth.service.mjs';
import { demoService } from '../../../services/demo.service.mjs';
import { clearError } from '../../../store/slices/universeSlice.mjs';
import { logoutThunk } from '../../../store/thunks/authThunks';
import {
  applyModalInteractionFixesThunk,
  initializeModalPortalThunk,
} from '../../../store/thunks/modalThunks';
import { deleteUniverse, fetchUniverses } from '../../../store/thunks/universeThunks';
import { AUTH_CONFIG } from '../../../utils/config';

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { universes, loading: universesLoading, error } = useSelector((state) => state.universes);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [modalState, setModalState] = useState({
    isCreateModalOpen: false,
    isEditModalOpen: false,
    isDeleteModalOpen: false,
    isViewModalOpen: false,
  });
  const [selectedUniverse, setSelectedUniverse] = useState(null);
  const [sortOption, setSortOption] = useState('updated_at');
  const [filterOption, setFilterOption] = useState('all');
  const [newUniverseId, setNewUniverseId] = useState(null);
  const [connectionError, setConnectionError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [loading, setLoading] = useState(true);
  const maxRetries = 3;

  const retryCountRef = useRef(0);

  useEffect(() => {
    console.log('Dashboard - Initializing modal portal');
    dispatch(initializeModalPortalThunk())
      .unwrap()
      .then((result) => {
        console.log('Modal portal initialized:', result);
        return dispatch(applyModalInteractionFixesThunk()).unwrap();
      })
      .then((result) => {
        console.log('Pre-applied modal interaction fixes:', result);
      })
      .catch((error) => {
        console.error('Error initializing modal infrastructure:', error);
      });
  }, [dispatch]);

  const loadUniverses = useCallback(async () => {
    console.log('Dashboard - loadUniverses called', {
      retryCount: retryCountRef.current,
      maxRetries,
      isDemoSession: demoService.isValidDemoSession(),
    });

    const isDemoSession = demoService.isValidDemoSession();
    console.log('Dashboard - loadUniverses: isDemoSession check =', isDemoSession);

    if (isDemoSession) {
      console.log('Dashboard - Demo session detected in loadUniverses, using demo flow');
      const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
      const refreshToken = localStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);

      if (!token || !refreshToken) {
        console.log('Dashboard - Demo tokens missing, regenerating demo session');
        try {
          await demoService.setupDemoSession();
        } catch (error) {
          console.error('Error setting up demo session:', error);
          throw error;
        }
      }

      try {
        console.log('Dashboard - Dispatching fetchUniverses for demo user');
        const result = await dispatch(fetchUniverses()).unwrap();
        console.log('Dashboard - Successfully loaded universes in demo mode', result);
        return result;
      } catch (error) {
        handleLoadError(error);
      }
    }

    try {
      console.log('Dashboard - Dispatching fetchUniverses for regular user');
      const result = await dispatch(fetchUniverses()).unwrap();
      console.log('Dashboard - Successfully loaded universes', result);
      return result;
    } catch (error) {
      console.error('Dashboard - Error loading universes:', error);
      throw error;
    }
  }, [dispatch]);

  const handleLoadError = (error) => {
    console.error('Dashboard - Error loading universes:', error);
    if (error.serverError || (error.response && error.response.status >= 500)) {
      console.warn('Server error detected (500), showing error UI');
      setConnectionError(true);
      if (retryCountRef.current < maxRetries) {
        console.log(`Dashboard - Scheduling automatic retry ${retryCountRef.current + 1} of ${maxRetries}`);
        retryCountRef.current += 1;
        setTimeout(() => {
          console.log('Dashboard - Executing scheduled retry');
          loadUniverses();
        }, 3000);
      } else {
        console.log('Dashboard - Maximum retries reached, not scheduling more retries');
      }
    }
    throw error;
  };

  useEffect(() => {
    console.log('Dashboard - Component mounted, loading universes');
    loadUniverses().catch((error) => {
      console.error('Dashboard - loadUniverses failed in mount useEffect:', error);
    });

    const handleServerError = (event) => {
      console.warn('Dashboard - Server error event received:', event.detail);
      setConnectionError(true);
    };

    window.addEventListener('server-error', handleServerError);
    return () => {
      window.removeEventListener('server-error', handleServerError);
    };
  }, [loadUniverses]);

  useEffect(() => {
    const isDemoSession = demoService.isValidDemoSession();
    if (isDemoSession) {
      console.log('Dashboard - Demo session detected');
      setLoading(false);
      return;
    }

    if (!isAuthenticated) {
      console.log('Not authenticated, redirecting to login');
      navigate('/?modal=login', { replace: true });
      return;
    }

    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    if (!token) {
      console.log('No token found, redirecting to login');
      dispatch(logoutThunk());
      navigate('/?modal=login', { replace: true });
      return;
    }

    setLoading(false);
  }, [isAuthenticated, dispatch, navigate]);

  const handleLogout = () => {
    console.log('Dashboard - Logging out user');
    authService.clearAuthData();
    dispatch(logoutThunk());
    navigate('/?modal=login', { replace: true });
  };

  const handleResetAuth = () => {
    console.log('Dashboard - Resetting authentication state');
    authService.resetAuth();
    dispatch(logoutThunk());
    navigate('/?modal=login', { replace: true });
  };

  const handleCreateClick = () => {
    console.log('Dashboard - Create button clicked');
    dispatch(clearError());
    setModalState((prev) => ({ ...prev, isCreateModalOpen: true }));
  };

  const closeModal = (prev) => {
     setModalState ((prev) => ({ ...prev, isCreateModalOpen: false, isEditModalOpen: false, isViewModalOpen: false,isDeleteModalOpen: false }))

  };

  const handleViewUniverse = (universe) => {
    setSelectedUniverse(universe)
    if (universe && universe.id) {
      setNewUniverseId(universe.id);
       setModalState((prev) => ({ ...prev, isViewModalOpen: true }))
    }
    closeModal(setModalState((prev) => ({ ...prev, isViewModalOpen: false})));
  }



  const handleCreateSuccess = (universe) => {
    console.log('Dashboard - Create success with universe:', universe);
    if (universe && universe.id) {
      setNewUniverseId(universe.id);
    }
    closeModal(setModalState((prev) => ({ ...prev, isCreateModalOpen: false })));
  };

  const handleEditUniverse = (universe) => {
    console.log('Editing universe:', universe);
    dispatch(clearError());
    setSelectedUniverse(universe);
    setModalState((prev) => ({ ...prev, isEditModalOpen: true }));
  };

  const handleEditSuccess = (updatedUniverse) => {
    console.log('Universe updated:', updatedUniverse);
    closeModal(setModalState((prev) => ({ ...prev, isEditModalOpen: false })));
    setSelectedUniverse(null);
  };

  const handleDeleteUniverse = (universe) => {
    console.log('Deleting universe:', universe);
    dispatch(clearError());
    setSelectedUniverse(universe);
    setModalState((prev) => ({ ...prev, isDeleteModalOpen: true }));
  };

  const handleConfirmDelete = async () => {
    if (selectedUniverse) {
      console.log('Confirming delete for universe:', selectedUniverse);
      try {
        await dispatch(deleteUniverse(selectedUniverse.id)).unwrap();
        console.log('Universe deleted successfully');
        closeModal(setModalState((prev) => ({ ...prev, isDeleteModalOpen: false })));
        setSelectedUniverse(null);
      } catch (error) {
        console.error('Error deleting universe:', error);
        closeModal(setModalState((prev) => ({ ...prev, isDeleteModalOpen: false })));
        setSelectedUniverse(null);
      }
    }
  };







  const getSortedUniverses = () => {
    if (!universes || !Array.isArray(universes)) {
      return [];
    }

    let filteredUniverses = [...universes];

    if (filterOption === 'public') {
      filteredUniverses = filteredUniverses.filter((u) => u.is_public);
    } else if (filterOption === 'private') {
      filteredUniverses = filteredUniverses.filter((u) => !u.is_public);
    }

    return filteredUniverses.sort((a, b) => {
      switch (sortOption) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'created_at':
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        case 'updated_at':
        default:
          return new Date(b.updated_at || 0) - new Date(a.updated_at || 0);
      }
    });
  };

  const handleRetry = () => {
    setIsRetrying(true);
    retryCountRef.current = 0;
    dispatch(clearError());

    setTimeout(() => {
      loadUniverses()
        .then(() => {
          console.log('Dashboard - Successfully retried loading universes');
          setConnectionError(false);
        })
        .catch((error) => {
          console.error('Retry failed:', error);
        })
        .finally(() => {
          setIsRetrying(false);
        });
    }, 1000);
  };

  const renderErrorDialog = () => {
    return (
      <Dialog
        open={connectionError}
        onClose={() => setConnectionError(false)}
        aria-labelledby="error-dialog-title"
      >
        <DialogTitle id="error-dialog-title">Server Connection Error</DialogTitle>
        <DialogContent>
          <p>There was an error connecting to the server. This might be due to:</p>
          <ul>
            <li>Temporary server unavailability</li>
            <li>Network connection issues</li>
            <li>Authentication problems</li>
          </ul>
          {error && (
            <div style={{ marginTop: '10px', color: '#d32f2f' }}>
              <p>
                <strong>Error details:</strong> {error.message || error}
              </p>
            </div>
          )}
          {retryCountRef.current >= maxRetries && (
            <div style={{ color: 'red', marginTop: '10px' }}>
              Maximum retry attempts reached. You may need to refresh the page or login again.
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => navigate('/?modal=login')} color="secondary">
            Go to Login
          </Button>
          <Button
            onClick={handleRetry}
            color="primary"
            disabled={isRetrying || retryCountRef.current >= maxRetries}
          >
            {isRetrying ? <CircularProgress size={24} /> : 'Retry'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  if (error) {
    const isAuthError =
      error.message?.includes('Signature verification') ||
      error.message?.includes('Authentication') ||
      error.message?.includes('token') ||
      error.status === 401;

    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <Typography variant="h4" component="h1">
            {isAuthError ? 'Authentication Error' : 'Error Loading Universes'}
          </Typography>
          <div className="dashboard-actions">
            {isAuthError ? (
              <Tooltip title="Re-authenticate to fix token issues">
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleLogout}
                  startIcon={<RefreshIcon />}
                >
                  Re-authenticate
                </Button>
              </Tooltip>
            ) : (
              <Tooltip title="Refresh Universes">
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<RefreshIcon />}
                  onClick={() => loadUniverses()}
                  disabled={loading}
                >
                  Retry
                </Button>
              </Tooltip>
            )}
            <Tooltip title="Logout">
              <Button
                variant="outlined"
                color="error"
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
                data-action="logout"
              >
                Logout
              </Button>
            </Tooltip>
          </div>
        </div>

        <Typography color="error" className="error-message" style={{ margin: '20px 0' }}>
          {isAuthError
            ? 'Your session has expired or is invalid. Please re-authenticate to continue.'
            : typeof error === 'object'
              ? JSON.stringify(error)
              : error}
        </Typography>

        {isAuthError && (
          <div
            style={{
              margin: '20px 0',
              padding: '15px',
              backgroundColor: '#f8f9fa',
              borderRadius: '4px',
            }}
          >
            <Typography variant="body1">This issue is typically caused by:</Typography>
            <ul>
              <li>Your session has expired</li>
              <li>The authentication token is invalid</li>
              <li>The server was restarted with a different secret key</li>
            </ul>
            <Typography variant="body1" style={{ marginTop: '10px' }}>
              Click the "Re-authenticate" button above to log in again.
            </Typography>
          </div>
        )}

        {!isAuthError && universes?.length > 0 && (
          <div className="universes-grid">
            {getSortedUniverses().map((universe) => (
              <UniverseCard
                key={universe.id}
                universe={universe}
                isNew={universe.id === newUniverseId}
                onView={() => handleViewUniverse(universe)}
                onEdit={() => handleEditUniverse(universe)}
                onDelete={() => handleDeleteUniverse(universe)}
              />
            ))}
          </div>
        )}
        {renderErrorDialog()}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <CircularProgress />
          <Typography variant="h6">Loading your universes...</Typography>
        </div>
      </div>
    );
  }

  if (!universes || universes.length === 0) {
    return (
      <div className="dashboard-container">
        <div className="empty-state">
          <Typography variant="h4" gutterBottom>
            Welcome to Harmonic Universe!
          </Typography>
          <Typography variant="body1" paragraph>
            Create your first universe to start exploring the connection between music and physics.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleCreateClick}
            startIcon={<AddIcon />}
          >
            Create Your First Universe
          </Button>
        </div>
        {renderModals()}
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <Typography variant="h4" component="h1">
          Your Universes
        </Typography>
        <div className="dashboard-actions">
          <Tooltip title="Create New Universe">
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleCreateClick}
            >
              Create Universe
            </Button>
          </Tooltip>
          <Tooltip title="Refresh Universes">
            <Button
              variant="outlined"
              color="primary"
              startIcon={<RefreshIcon />}
              onClick={() => loadUniverses()}
              disabled={loading}
            >
              Refresh
            </Button>
          </Tooltip>
          <Tooltip title="Re-authenticate">
            <Button variant="outlined" color="secondary" onClick={handleLogout}>
              Re-authenticate
            </Button>
          </Tooltip>
          <Tooltip title="Reset Auth (Fix Issues)">
            <Button
              variant="outlined"
              color="warning"
              startIcon={<ResetIcon />}
              onClick={handleResetAuth}
            >
              Reset Auth
            </Button>
          </Tooltip>
          <Tooltip title="Logout">
            <Button
              variant="outlined"
              color="error"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              data-action="logout"
            >
              Logout
            </Button>
          </Tooltip>
        </div>
      </div>
      <div className="universes-controls">
        <Tooltip title="Filter universes by visibility" placement="top">
          <select
            className="control-select"
            value={filterOption}
            onChange={(e) => setFilterOption(e.target.value)}
          >
            <option value="all">All Universes</option>
            <option value="public">Public Only</option>
            <option value="private">Private Only</option>
          </select>
        </Tooltip>

        <Tooltip title="Sort universes by different criteria" placement="top">
          <select
            className="control-select"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
          >
            <option value="updated_at">Recently Updated</option>
            <option value="created_at">Recently Created</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </Tooltip>
      </div>
      <div className="universes-grid">
        {getSortedUniverses().map((universe) => (
          <UniverseCard
            key={universe.id}
            universe={universe}
            isNew={universe.id === newUniverseId}
            onView={() => handleViewUniverse(universe)}
            onEdit={() => handleEditUniverse(universe)}
            onDelete={() => handleDeleteUniverse(universe)}
          />
        ))}
      </div>
      {renderModals()}
      {renderErrorDialog()}
    </div>
  );

  function renderModals() {
    return (
      <>
        <Suspense fallback={<div>Loading Universe Modal...</div>}>
          <UniverseModal
            isOpen={modalState.isCreateModalOpen}
            onClose={() => setModalState((prev) => ({ ...prev, isCreateModalOpen: false }))}
            onSuccess={handleCreateSuccess}
            mode="create"
          />
        </Suspense>

        <Suspense fallback={<div>Loading Universe Modal...</div>}>
          <UniverseModal
            isOpen={modalState.isEditModalOpen}
            onClose={() => setModalState((prev) => ({ ...prev, isEditModalOpen: false }))}
            universe={selectedUniverse}
            onSuccess={handleEditSuccess}
            mode="edit"
          />
        </Suspense>

        {modalState.isDeleteModalOpen && selectedUniverse && (
          <Dialog
            open={modalState.isDeleteModalOpen}
            onClose={() => setModalState((prev) => ({ ...prev, isDeleteModalOpen: false }))}
            disableEnforceFocus
            disableAutoFocus
            style={{ zIndex: 1050 }}
            hideBackdrop={true}
          >
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogContent>
              <Typography>
                Are you sure you want to delete the universe "{selectedUniverse.name}"? This action
                cannot be undone and will delete all associated scenes, characters, and notes.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setModalState((prev) => ({ ...prev, isDeleteModalOpen: false }))}>
                Cancel
              </Button>
              <Button onClick={handleConfirmDelete} color="error">
                Delete
              </Button>
            </DialogActions>
          </Dialog>
        )}
      </>
    );
  }
};

export default Dashboard;
