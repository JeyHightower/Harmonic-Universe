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
import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

// Import the UniverseModal and UniverseCard from features/universe
import { UniverseCard, UniverseModal } from '../../universe';

import { message } from 'antd';
import { authService } from '../../../services/auth.service.mjs';
import { demoUserService } from '../../../services/demo-user.service.mjs';
import { clearError } from '../../../store/slices/universeSlice.mjs';
import { logout, validateAndRefreshToken } from '../../../store/thunks/authThunks';
import {
    applyModalInteractionFixesThunk,
    initializeModalPortalThunk,
} from '../../../store/thunks/modalThunks';
import { deleteUniverse, fetchUniverses } from '../../../store/thunks/universeThunks';
import { AUTH_CONFIG } from '../../../utils/config';

/**
 * Dashboard component for displaying and managing user's universes
 * Combines features from both Dashboard implementations
 */
const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { universes, loading, error } = useSelector((state) => state.universes);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUniverse, setSelectedUniverse] = useState(null);
  const [sortOption, setSortOption] = useState('updated_at');
  const [filterOption, setFilterOption] = useState('all');
  const [newUniverseId, setNewUniverseId] = useState(null);
  const [connectionError, setConnectionError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const maxRetries = 3;

  // Track last dashboard logout attempt
  let lastDashboardLogoutAttempt = 0;
  let lastDashboardLoadAttempt = 0;
  const DASHBOARD_LOGOUT_COOLDOWN = 2000; // 2 seconds

  // Initialize modal portal and apply fixes on component mount
  useEffect(() => {
    console.log('Dashboard - Initializing modal portal');

    // Initialize the modal portal
    dispatch(initializeModalPortalThunk())
      .unwrap()
      .then((result) => {
        console.log('Modal portal initialized:', result);

        // Pre-apply interaction fixes to ensure they're ready when a modal is opened
        return dispatch(applyModalInteractionFixesThunk()).unwrap();
      })
      .then((result) => {
        console.log('Pre-applied modal interaction fixes:', result);
      })
      .catch((error) => {
        console.error('Error initializing modal infrastructure:', error);
      });
  }, [dispatch]);

  // Create a memoized function to load universes
  const loadUniverses = useCallback(async () => {
    // Update the timestamp to prevent duplicate calls
    lastDashboardLoadAttempt = Date.now();

    // Handle errors from fetching universes
    const handleFetchError = (error) => {
      console.error('Dashboard - Error loading universes:', error);

      // Handle server errors gracefully
      if (error.serverError || (error.response && error.response.status >= 500)) {
        console.warn('Server error detected (500), showing error UI');
        setConnectionError(true);

        // Schedule an automatic retry if we haven't exceeded the limit
        if (retryCount < maxRetries) {
          console.log(`Dashboard - Scheduling automatic retry ${retryCount + 1} of ${maxRetries}`);
          setTimeout(() => {
            setRetryCount((prev) => prev + 1);
          }, 3000); // Wait 3 seconds before retrying
        }

        return Promise.reject(error);
      }

      // Handle specific error cases
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('Dashboard - Authentication error loading universes, attempting token refresh');

        // Try to refresh the token and retry
        return authService
          .refreshToken()
          .then(() => {
            console.log('Dashboard - Token refreshed, retrying universe load');
            return dispatch(fetchUniverses()).unwrap().catch(handleFetchError);
          })
          .catch(() => {
            console.log('Dashboard - Token refresh failed, redirecting to login');
            dispatch(logout());
            navigate('/?modal=login', { replace: true });
            return Promise.reject(error);
          });
      }

      return Promise.reject(error);
    };

    // Check if this is a demo session
    const isDemoSession = demoUserService.isDemoSession();

    if (isDemoSession) {
      console.log('Dashboard - Demo session detected');

      // Check if we have both tokens
      const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
      const refreshToken = localStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);

      if (!token || !refreshToken) {
        console.log('Dashboard - Demo tokens missing, regenerating demo session');
        demoUserService.setupDemoSession();
      }

      // Continue to load universes using dispatch
      return dispatch(fetchUniverses())
        .unwrap()
        .then((result) => {
          console.log('Dashboard - Successfully loaded universes in demo mode');
          return result;
        })
        .catch((error) => {
          console.error('Dashboard - Error loading universes in demo mode:', error);

          // Handle server errors gracefully
          if (error.serverError || (error.response && error.response.status >= 500)) {
            console.warn('Server error detected (500), showing error UI');
            setConnectionError(true);

            // Schedule an automatic retry if we haven't exceeded the limit
            if (retryCount < maxRetries) {
              console.log(
                `Dashboard - Scheduling automatic retry ${retryCount + 1} of ${maxRetries}`
              );
              setTimeout(() => {
                setRetryCount((prev) => prev + 1);
              }, 3000); // Wait 3 seconds before retrying
            }
          }

          // Let Redux handle the error state for non-connection errors
          return Promise.reject(error);
        });
    }

    // Not in demo mode, check for valid token
    if (!authService.hasValidToken()) {
      console.log('Dashboard - No valid token found, checking refresh token availability');

      // Check if a refresh token exists before attempting to refresh
      const refreshToken = localStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
      if (!refreshToken) {
        console.log('Dashboard - No refresh token available, redirecting to login');
        // Clear any stale auth data
        authService.clearAuthData();
        dispatch(logout());
        // Use a short timeout to ensure the auth state updates before redirect
        setTimeout(() => {
          navigate('/?modal=login', {
            replace: true,
            state: { message: 'Your session has expired. Please log in again.' },
          });
        }, 10);
        return Promise.reject(new Error('No refresh token available'));
      }

      // Try to refresh the token - using promise chain instead of async/await
      console.log('Dashboard - Attempting to refresh token');

      // Create a function to handle the token refresh logic
      const attemptTokenRefresh = () => {
        // Track refresh attempts
        let refreshAttemptInProgress = false;

        // Add a timeout to avoid waiting too long
        const refreshPromise = authService.refreshToken();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Token refresh timed out')), 8000);
        });

        refreshAttemptInProgress = true;

        // Use Promise.race wrapped in a Promise chain
        return Promise.race([refreshPromise, timeoutPromise])
          .then((refreshedToken) => {
            if (!refreshedToken) {
              throw new Error('Failed to refresh token - no token returned');
            }

            console.log('Dashboard - Token refreshed successfully, loading universes');
            return dispatch(fetchUniverses())
              .unwrap()
              .then((result) => {
                console.log('Dashboard - Successfully loaded universes after token refresh');
                return result;
              })
              .catch(handleFetchError);
          })
          .catch((error) => {
            console.error('Dashboard - Token refresh failed:', error.message);

            // Check if token refresh is already in progress elsewhere
            if (
              typeof window !== 'undefined' &&
              window.__TOKEN_REFRESH_IN_PROGRESS &&
              !refreshAttemptInProgress
            ) {
              console.log(
                'Dashboard - Another token refresh is in progress, waiting for completion'
              );

              // Wait a moment for the other refresh to complete then check for token
              return new Promise((resolve) => setTimeout(resolve, 1000)).then(() => {
                // Check if a token is now available
                const newToken = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
                if (newToken) {
                  console.log('Dashboard - New token available after waiting for parallel refresh');
                  return dispatch(fetchUniverses())
                    .unwrap()
                    .then((result) => {
                      console.log('Dashboard - Successfully loaded universes with refreshed token');
                      return result;
                    })
                    .catch(handleFetchError);
                }

                // No token available, propagate the original error
                throw error;
              });
            }

            // Handle server errors gracefully
            if (error.serverError || (error.response && error.response.status >= 500)) {
              console.warn('Server error detected (500) during token refresh, showing error UI');
              setConnectionError(true);

              // Schedule an automatic retry if we haven't exceeded the limit
              if (retryCount < maxRetries) {
                console.log(
                  `Dashboard - Scheduling automatic retry ${retryCount + 1} of ${maxRetries}`
                );
                setTimeout(() => {
                  setRetryCount((prev) => prev + 1);
                }, 3000); // Wait 3 seconds before retrying
              }

              throw error;
            }

            // Only redirect for auth errors, not network errors
            if (
              error.response?.status >= 400 ||
              (!error.message?.includes('Network Error') && !error.message?.includes('timed out'))
            ) {
              console.log('Dashboard - Redirecting to login due to auth error');
              authService.clearAuthData();
              dispatch(logout());
              // Use a short timeout to ensure the auth state updates before redirect
              setTimeout(() => {
                navigate('/?modal=login', {
                  replace: true,
                  state: { message: 'Your session has expired. Please log in again.' },
                });
              }, 10);

              throw error;
            } else {
              console.log(
                'Dashboard - Network error during token refresh, proceeding with existing token'
              );
              // Attempt to load universes with the existing token since it might be a temporary network issue
              return dispatch(fetchUniverses())
                .unwrap()
                .then((result) => {
                  console.log('Dashboard - Successfully loaded universes with existing token');
                  return result;
                })
                .catch(handleFetchError);
            }
          });
      };

      // Execute the token refresh logic
      return attemptTokenRefresh();
    }

    // Token is valid, proceed with loading universes
    return dispatch(fetchUniverses())
      .unwrap()
      .then((result) => {
        console.log('Dashboard - Successfully loaded universes with valid token');
        return result;
      })
      .catch(handleFetchError);
  }, [dispatch, navigate, retryCount, maxRetries]);

  // Load universes on component mount
  useEffect(() => {
    console.log('Dashboard - Component mounted, loading universes');
    loadUniverses();

    // Add event listener for server errors
    const handleServerError = (event) => {
      console.warn('Dashboard - Server error event received:', event.detail);
      setConnectionError(true);
    };

    // Listen for server-error events
    window.addEventListener('server-error', handleServerError);

    // Cleanup listener on unmount
    return () => {
      window.removeEventListener('server-error', handleServerError);
    };
  }, [loadUniverses]);

  // Check for authentication and load data on component mount
  useEffect(() => {
    // First check if this is a demo session
    const isDemoSession = demoUserService.isDemoSession();

    if (isDemoSession) {
      console.log('Dashboard - Demo session detected, ensuring tokens are set');
      // Ensure demo tokens are properly set up
      if (
        !localStorage.getItem(AUTH_CONFIG.TOKEN_KEY) ||
        !localStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_KEY)
      ) {
        console.log('Demo tokens missing, regenerating');
        demoUserService.setupDemoSession();
      }
      // Proceed to load universes
      loadUniverses();
      return;
    }

    // Not in demo mode, check regular auth
    if (!isAuthenticated) {
      console.log('Not authenticated, redirecting to login');
      navigate('/?modal=login', { replace: true });
      return;
    }

    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    if (!token) {
      console.log('No token found, redirecting to login');
      dispatch(logout());
      navigate('/?modal=login', { replace: true });
      return;
    }

    console.log('Dashboard - Fetching universes...');
    loadUniverses();
  }, [isAuthenticated, dispatch, navigate, loadUniverses]);

  // Consistent logout handler that uses the auth service
  const handleLogout = () => {
    const now = Date.now();

    if (now - lastDashboardLogoutAttempt < DASHBOARD_LOGOUT_COOLDOWN) {
      console.log('Dashboard - Logout throttled (multiple attempts)');
      return;
    }

    lastDashboardLogoutAttempt = now;

    console.log('Dashboard - Logging out user');
    authService.clearAuthData();
    dispatch(logout());
    navigate('/?modal=login', { replace: true });
  };

  // Reset authentication and redirect to login
  const handleResetAuth = () => {
    console.log('Dashboard - Resetting authentication state');
    authService.resetAuth();
    dispatch(logout());
    navigate('/?modal=login', { replace: true });
  };

  const handleCreateClick = () => {
    console.log('Dashboard - Create button clicked');
    // Clear any errors before opening the create modal
    dispatch(clearError());
    setIsCreateModalOpen(true);
  };

  const handleCreateSuccess = (universe) => {
    console.log('Dashboard - Create success with universe:', universe);

    // Set the new universe ID first so UI can highlight it
    if (universe && universe.id) {
      setNewUniverseId(universe.id);
    }

    // Close modal after a small delay
    setTimeout(() => {
      setIsCreateModalOpen(false);
    }, 50);

    // No need to refetch - Redux state already has the new universe
  };

  const handleViewUniverse = (universe) => {
    console.log('Viewing universe:', universe);

    // Clear any errors before navigating
    dispatch(clearError());

    // Ensure we have a fresh auth token before navigating
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    if (token) {
      // Force token refresh to ensure it's valid
      dispatch(validateAndRefreshToken())
        .then(() => {
          navigate(`/universes/${universe.id}`);
        })
        .catch((error) => {
          console.error('Error refreshing token:', error);
          // Show auth error message
          message.error('Authentication error. Please log in again.');
          dispatch(logout());
        });
    } else {
      message.error('Authentication required. Please log in.');
      dispatch(logout());
    }
  };

  const handleEditUniverse = (universe) => {
    console.log('Editing universe:', universe);
    // Clear any errors before editing
    dispatch(clearError());
    setSelectedUniverse(universe);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = (updatedUniverse) => {
    console.log('Universe updated:', updatedUniverse);

    // Close modal after a small delay to ensure Redux state is updated first
    setTimeout(() => {
      setIsEditModalOpen(false);
      setSelectedUniverse(null);
    }, 50);

    // No need to refetch - Redux state already has the updated universe
  };

  const handleDeleteUniverse = (universe) => {
    console.log('Deleting universe:', universe);
    // Clear any errors before delete confirmation
    dispatch(clearError());
    setSelectedUniverse(universe);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedUniverse) {
      console.log('Confirming delete for universe:', selectedUniverse);
      try {
        await dispatch(deleteUniverse(selectedUniverse.id)).unwrap();
        console.log('Universe deleted successfully');

        // Update UI after a small delay to ensure Redux updates are processed
        setTimeout(() => {
          setIsDeleteModalOpen(false);
          setSelectedUniverse(null);
        }, 50);

        // No need to refetch - Redux state already removes the deleted universe
      } catch (error) {
        console.error('Error deleting universe:', error);
        // Still close modal on error
        setIsDeleteModalOpen(false);
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
    setRetryCount((count) => count + 1);

    // Clear any errors in Redux store
    dispatch(clearError());

    // Small delay before retry
    setTimeout(() => {
      dispatch(fetchUniverses())
        .unwrap()
        .then((result) => {
          console.log('Dashboard - Successfully retried loading universes');
          setConnectionError(false);
        })
        .catch((error) => {
          console.error('Retry failed:', error);
          // Server errors handled by the loadUniverses function and Redux
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
          {retryCount >= maxRetries && (
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
            disabled={isRetrying || retryCount >= maxRetries}
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
        {/* Modals */}
        {renderModals()}
        {/* Error Dialog */}
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
        {isCreateModalOpen && (
          <UniverseModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onSuccess={handleCreateSuccess}
            mode="create"
          />
        )}
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
        <Tooltip content="Filter universes by visibility" position="top">
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

        <Tooltip content="Sort universes by different criteria" position="top">
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
      {/* Error Dialog */}
      {renderErrorDialog()}
    </div>
  );

  function renderModals() {
    return (
      <>
        <UniverseModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleCreateSuccess}
          mode="create"
        />

        <UniverseModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          universe={selectedUniverse}
          onSuccess={handleEditSuccess}
          mode="edit"
        />

        {isDeleteModalOpen && selectedUniverse && (
          <Dialog
            open={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            disableEnforceFocus
            disableAutoFocus
            style={{ zIndex: 1050 }}
          >
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogContent>
              <Typography>
                Are you sure you want to delete the universe "{selectedUniverse.name}"? This action
                cannot be undone and will delete all associated scenes, characters, and notes.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDeleteModalOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleConfirmDelete();
                }}
                color="error"
              >
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
