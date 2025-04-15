import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  CircularProgress,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  DialogContentText,
  TextField,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Logout as LogoutIcon,
} from "@mui/icons-material";

// Create placeholder components for missing imports
const UniverseCard = ({ universe, onView, onEdit, onDelete, isHighlighted }) => (
  <div style={{ border: isHighlighted ? '2px solid blue' : '1px solid gray', padding: '10px', margin: '10px' }}>
    <h3>{universe.name}</h3>
    <p>{universe.description}</p>
    <div>
      <button onClick={() => onView(universe)}>View</button>
      <button onClick={() => onEdit(universe)}>Edit</button>
      <button onClick={() => onDelete(universe)}>Delete</button>
    </div>
  </div>
);

const UniverseModal = ({ open, onClose, universe, onSuccess }) => (
  <Dialog
    open={open || false}
    onClose={onClose}
    maxWidth="md"
    fullWidth
    PaperProps={{
      component: 'form',
      onSubmit: (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const universeData = {
          name: formData.get('name'),
          description: formData.get('description'),
          is_public: formData.get('is_public') === 'true'
        };
        onSuccess(universeData);
        onClose();
      },
    }}
  >
    <DialogTitle>{universe ? 'Edit Universe' : 'Create New Universe'}</DialogTitle>
    <DialogContent>
      <DialogContentText>
        {universe 
          ? 'Edit your universe details below.' 
          : 'Enter details for your new universe. You can add scenes later.'}
      </DialogContentText>
      <TextField
        autoFocus
        margin="normal"
        id="name"
        name="name"
        label="Universe Name"
        type="text"
        fullWidth
        variant="outlined"
        defaultValue={universe?.name || ''}
        required
      />
      <TextField
        margin="normal"
        id="description"
        name="description"
        label="Description"
        type="text"
        fullWidth
        multiline
        rows={4}
        variant="outlined"
        defaultValue={universe?.description || ''}
      />
      <FormControlLabel
        control={
          <Checkbox
            name="is_public"
            value="true"
            defaultChecked={universe?.is_public !== false}
          />
        }
        label="Make this universe public"
      />
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
      <Button type="submit" variant="contained" color="primary">
        {universe ? 'Save Changes' : 'Create Universe'}
      </Button>
    </DialogActions>
  </Dialog>
);

import { fetchUniverses } from "../../../store/thunks/universeThunks";
import { deleteUniverse } from "../../../store/thunks/universeThunks";
import { AUTH_CONFIG } from "../../../utils/config";
import { logout } from "../../../store/thunks/authThunks";
import api from "../../../services/api.adapter";
import { authService } from "../../../services/auth.service.mjs";

/**
 * Dashboard component for displaying and managing user's universes
 * Combines features from both Dashboard implementations
 */
const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { universes, loading, error } = useSelector((state) => state.universes);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUniverse, setSelectedUniverse] = useState(null);
  const [sortOption, setSortOption] = useState("updated_at");
  const [filterOption, setFilterOption] = useState("all");
  const [newUniverseId, setNewUniverseId] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // Track last dashboard logout attempt
  let lastDashboardLogoutAttempt = 0;
  const DASHBOARD_LOGOUT_COOLDOWN = 2000; // 2 seconds

  // Enhanced function to load universes with better error handling and logging
  const loadUniverses = useCallback(() => {
    console.log("Dashboard - Loading universes, attempt:", retryCount + 1);
    
    // Check token before making request
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    const tokenVerificationFailed = localStorage.getItem("token_verification_failed");
    
    if (!token) {
      console.error("Dashboard - No auth token found, cannot load universes");
      navigate("/?modal=login", { replace: true });
      return Promise.resolve({ error: "Authentication error" });
    }
    
    if (tokenVerificationFailed === "true") {
      console.error("Dashboard - Token verification previously failed");
      // Clear the flag and redirect to login
      localStorage.removeItem("token_verification_failed");
      navigate("/?modal=login", { replace: true });
      return Promise.resolve({ error: "Authentication error" });
    }
    
    return dispatch(fetchUniverses({ userId: user?.id, user_only: true }))
      .then((result) => {
        console.log("Dashboard - Fetch universes result:", {
          type: result.type,
          hasError: !!result.error, 
          meta: result.meta,
        });
        
        // Check if the action was rejected
        if (result.error) {
          console.error("Dashboard - API error response:", result.payload);
          
          // Check for authentication errors (401)
          const isAuthError = 
            result.payload?.status === 401 || 
            result.payload?.authError || 
            (result.payload?.message && (
              result.payload.message.includes("authentication") ||
              result.payload.message.includes("Signature verification failed") ||
              result.payload.message.includes("token") ||
              result.payload.message.includes("login")
            ));
            
          if (isAuthError) {
            console.error("Dashboard - Authentication error, redirecting to login");
            localStorage.setItem("token_verification_failed", "true");
            navigate("/?modal=login", { replace: true });
            return { error: "Authentication error" };
          }
          
          return { error: result.payload?.message || "API error" };
        }
        
        // Process successful result
        let universes = [];
        if (Array.isArray(result.payload)) {
          universes = result.payload;
        } else if (
          result.payload.universes &&
          Array.isArray(result.payload.universes)
        ) {
          universes = result.payload.universes;
        } else if (
          result.payload.data &&
          Array.isArray(result.payload.data.universes)
        ) {
          universes = result.payload.data.universes;
        } else {
          console.warn(
            "Dashboard - Unexpected response format:",
            result.payload
          );
        }

        return { universes };
      })
      .catch((error) => {
        console.error("Dashboard - Error loading universes:", {
          error: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });
        
        // Check if error is related to authentication
        const isAuthError = 
          error.response?.status === 401 || 
          error.message?.includes("authentication") ||
          error.message?.includes("Signature verification failed") ||
          error.message?.includes("token") ||
          error.message?.includes("login");
          
        if (isAuthError) {
          console.error("Dashboard - Authentication error in catch block, redirecting to login");
          localStorage.setItem("token_verification_failed", "true");
          navigate("/?modal=login", { replace: true });
          return { error: "Authentication error" };
        }
        
        return { error: error.message };
      });
  }, [dispatch, retryCount, user?.id, navigate]);

  // Load universes on component mount
  useEffect(() => {
    console.log("Dashboard - Component mounted, loading universes");
    loadUniverses();
  }, [loadUniverses]);

  // Debug log to check universes data
  useEffect(() => {
    if (universes) {
      console.log("Dashboard - Current universes state:", {
        count: Array.isArray(universes) ? universes.length : "not an array",
        data: universes,
        type: typeof universes,
        isArray: Array.isArray(universes),
        hasData: !!universes,
      });
    } else {
      console.log("Dashboard - Universes state is null or undefined");
    }
  }, [universes]);

  // Check for authentication and load data on component mount or retry
  useEffect(() => {
    if (!isAuthenticated) {
      console.log("Not authenticated, redirecting to login");
      navigate("/?modal=login", { replace: true });
      return;
    }
    
    // Verify token validity before fetching data
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    if (!token) {
      console.log("No token found, redirecting to login");
      dispatch(logout());
      navigate("/?modal=login", { replace: true });
      return;
    }
    
    // Check if token had previously failed verification
    const tokenVerificationFailed = localStorage.getItem("token_verification_failed");
    if (tokenVerificationFailed === "true") {
      console.log("Token verification previously failed, refreshing authentication");
      localStorage.removeItem("token_verification_failed");
      
      // Perform a complete auth cleanup and redirect
      console.log("Cleaning up authentication state and redirecting to login");
      handleRefreshAuth();
      return;
    }
    
    // Only fetch if we have a valid token and no previous verification failures
    console.log("Dashboard - Fetching universes...");
    loadUniverses().then(result => {
      if (result && result.error && (
          result.error === "Authentication failed" || 
          (typeof result.error === 'object' && result.error.authError) ||
          result.error.includes && result.error.includes('Signature verification')
         )) {
        console.log("Authentication failed during universe fetch, redirecting to login");
        handleRefreshAuth();
      }
    });
  }, [isAuthenticated, dispatch, navigate, loadUniverses]);

  // Clear new universe highlight after delay
  useEffect(() => {
    if (newUniverseId) {
      const timer = setTimeout(() => {
        setNewUniverseId(null);
      }, 5000); // Clear after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [newUniverseId]);

  // Consistent logout handler that uses the auth service
  const handleLogout = () => {
    const now = Date.now();
    
    // Prevent multiple rapid logout attempts
    if (now - lastDashboardLogoutAttempt < DASHBOARD_LOGOUT_COOLDOWN) {
      console.log("Dashboard - Logout throttled (multiple attempts)");
      return;
    }
    
    // Update timestamp
    lastDashboardLogoutAttempt = now;
    
    console.log("Dashboard - Logging out user");
    
    // Disable the logout buttons temporarily to prevent multiple clicks
    const logoutButtons = document.querySelectorAll('button[data-action="logout"]');
    logoutButtons.forEach(button => {
      if (button) {
        button.disabled = true;
        setTimeout(() => {
          if (button) button.disabled = false;
        }, DASHBOARD_LOGOUT_COOLDOWN);
      }
    });
    
    // Use the auth service for consistent logout
    authService.clearAuthData();
    dispatch(logout());
    navigate("/?modal=login", { replace: true });
  };
  
  // Consistent auth refresh handler that uses the auth service
  const handleRefreshAuth = () => {
    console.log("Dashboard - Refreshing authentication");
    
    // Use the auth service for consistent cleanup
    authService.clearAuthData();
    
    // Dispatch logout action
    dispatch(logout());
    
    // Redirect to login page with modal
    navigate("/?modal=login", { replace: true });
  };

  const handleCreateClick = () => {
    console.log("Dashboard - Create button clicked");
    setIsCreateModalOpen(true);
  };

  const handleCreateSuccess = (universe) => {
    console.log("Dashboard - Create success with universe:", universe);
    setIsCreateModalOpen(false);

    // Set the new universe ID to highlight it
    if (universe && universe.id) {
      setNewUniverseId(universe.id);
    }

    // Refresh the list immediately
    loadUniverses();
  };

  // Handle View Universe
  const handleViewUniverse = (universe) => {
    console.log("Viewing universe:", universe);
    navigate(`/universes/${universe.id}`);
  };

  // Handle Edit Universe
  const handleEditUniverse = (universe) => {
    console.log("Editing universe:", universe);
    setSelectedUniverse(universe);
    setIsEditModalOpen(true);
  };

  // Handle Edit Success
  const handleEditSuccess = (updatedUniverse) => {
    console.log("Universe updated:", updatedUniverse);
    setIsEditModalOpen(false);
    setSelectedUniverse(null);
    loadUniverses();
  };

  // Handle Delete Universe
  const handleDeleteUniverse = (universe) => {
    console.log("Deleting universe:", universe);
    setSelectedUniverse(universe);
    setIsDeleteModalOpen(true);
  };

  // Handle Confirm Delete
  const handleConfirmDelete = async () => {
    if (selectedUniverse) {
      console.log("Confirming delete for universe:", selectedUniverse);
      try {
        await dispatch(deleteUniverse(selectedUniverse.id));
        console.log("Universe deleted successfully");
        loadUniverses();
      } catch (error) {
        console.error("Error deleting universe:", error);
      }
      setIsDeleteModalOpen(false);
      setSelectedUniverse(null);
    }
  };

  // Sort universes based on selected option
  const getSortedUniverses = () => {
    if (!universes || !Array.isArray(universes)) {
      return [];
    }

    let filteredUniverses = [...universes];

    // Apply filter
    if (filterOption === "public") {
      filteredUniverses = filteredUniverses.filter((u) => u.is_public);
    } else if (filterOption === "private") {
      filteredUniverses = filteredUniverses.filter((u) => !u.is_public);
    }

    // Apply sort
    return filteredUniverses.sort((a, b) => {
      switch (sortOption) {
        case "name":
          return (a.name || "").localeCompare(b.name || "");
        case "created_at":
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        case "updated_at":
        default:
          return new Date(b.updated_at || 0) - new Date(a.updated_at || 0);
      }
    });
  };

  // Render error state with auth error handling
  if (error) {
    const isAuthError = error.message?.includes("Signature verification") || 
                      error.message?.includes("Authentication") || 
                      error.message?.includes("token") ||
                      error.status === 401;
    
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <Typography variant="h4" component="h1">
            {isAuthError ? "Authentication Error" : "Error Loading Universes"}
          </Typography>
          <div className="dashboard-actions">
            {isAuthError ? (
              <Tooltip title="Re-authenticate to fix token issues">
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleRefreshAuth}
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
          {isAuthError ? 
            "Your session has expired or is invalid. Please re-authenticate to continue." : 
            (typeof error === "object" ? JSON.stringify(error) : error)}
        </Typography>
        
        {isAuthError && (
          <div style={{ margin: '20px 0', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
            <Typography variant="body1">
              This issue is typically caused by:
            </Typography>
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
      </div>
    );
  }

  // Render loading state
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

  // Show empty state for new users
  if (!universes || universes.length === 0) {
    return (
      <div className="dashboard-container">
        <div className="empty-state">
          <Typography variant="h4" gutterBottom>
            Welcome to Harmonic Universe!
          </Typography>
          <Typography variant="body1" paragraph>
            Create your first universe to start exploring the connection between
            music and physics.
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
            open={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onSuccess={handleCreateSuccess}
          />
        )}
      </div>
    );
  }

  // Render universes grid (main view)
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
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleRefreshAuth}
            >
              Re-authenticate
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
    </div>
  );

  // Helper function to render modals
  function renderModals() {
    return (
      <>
        {isCreateModalOpen && (
          <UniverseModal
            open={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onSuccess={handleCreateSuccess}
          />
        )}
        {isEditModalOpen && selectedUniverse && (
          <UniverseModal
            open={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSuccess={handleEditSuccess}
            universe={selectedUniverse}
            isEdit={true}
          />
        )}
        {isDeleteModalOpen && selectedUniverse && (
          <Dialog
            open={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
          >
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogContent>
              <Typography>
                Are you sure you want to delete the universe "
                {selectedUniverse.name}"? This action cannot be undone and will
                delete all associated scenes, characters, and notes.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setIsDeleteModalOpen(false)}>
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
