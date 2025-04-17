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
} from "@mui/material";
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Logout as LogoutIcon,
  RestartAlt as ResetIcon,
} from "@mui/icons-material";

// Import the UniverseModal and UniverseCard from features/universe
import { UniverseModal, UniverseCard } from "../../universe";

import { fetchUniverses } from "../../../store/thunks/universeThunks";
import { deleteUniverse } from "../../../store/thunks/universeThunks";
import { AUTH_CONFIG } from "../../../utils/config";
import { logout } from "../../../store/thunks/authThunks";
import api from "../../../services/api.adapter";
import { authService } from "../../../services/auth.service.mjs";
import { demoUserService } from "../../../services/demo-user.service.mjs";

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
  const [sortOption, setSortOption] = useState("updated_at");
  const [filterOption, setFilterOption] = useState("all");
  const [newUniverseId, setNewUniverseId] = useState(null);

  // Track last dashboard logout attempt
  let lastDashboardLogoutAttempt = 0;
  const DASHBOARD_LOGOUT_COOLDOWN = 2000; // 2 seconds

  // Enhanced function to load universes with better error handling and logging
  const loadUniverses = useCallback(() => {
    console.log("Dashboard - Loading universes");
    
    // Check if this is a demo session
    const isDemoSession = demoUserService.isDemoSession();
    
    // If in demo mode and tokens are missing, regenerate them
    if (isDemoSession) {
      console.log("Dashboard - Demo session detected");
      
      // Check if we have both tokens
      const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
      const refreshToken = localStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
      
      if (!token || !refreshToken) {
        console.log("Dashboard - Demo tokens missing, regenerating demo session");
        demoUserService.setupDemoSession();
      }
      
      // Continue to load universes using dispatch
      return dispatch(fetchUniverses()).catch((error) => {
        console.error("Dashboard - Error loading universes in demo mode:", error);
        return Promise.resolve({ error: "Error loading demo universes" });
      });
    }
    
    // Not in demo mode, check for valid token
    if (!authService.hasValidToken()) {
      console.log("Dashboard - No valid token found, attempting refresh");
      
      // Try to refresh the token
      return authService.refreshToken()
        .then(() => {
          console.log("Dashboard - Token refreshed successfully, loading universes");
          return dispatch(fetchUniverses());
        })
        .catch((error) => {
          console.error("Dashboard - Token refresh failed:", error.message);
          
          // Only redirect for auth errors, not network errors
          if (error.response?.status >= 400 || 
              !error.message?.includes('Network Error')) {
            console.log("Dashboard - Redirecting to login due to auth error");
            navigate("/?modal=login", { replace: true });
          } else {
            console.log("Dashboard - Network error during token refresh, proceeding with existing token");
            // Attempt to load universes with the existing token since it might be a temporary network issue
            return dispatch(fetchUniverses());
          }
          
          return Promise.resolve({ error: "Authentication error" });
        });
    }
    
    // Token is valid, proceed with loading universes
    return dispatch(fetchUniverses())
      .catch((error) => {
        console.error("Dashboard - Error loading universes:", error);
        
        // Handle specific error cases
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.log("Dashboard - Authentication error loading universes, attempting token refresh");
          
          // Try to refresh the token and retry
          return authService.refreshToken()
            .then(() => {
              console.log("Dashboard - Token refreshed, retrying universe load");
              return dispatch(fetchUniverses());
            })
            .catch(() => {
              console.log("Dashboard - Token refresh failed, redirecting to login");
              navigate("/?modal=login", { replace: true });
              return Promise.resolve({ error: "Authentication error" });
            });
        }
        
        return Promise.resolve({ error: error.message });
      });
  }, [dispatch, navigate]);

  // Load universes on component mount
  useEffect(() => {
    console.log("Dashboard - Component mounted, loading universes");
    loadUniverses();
  }, [loadUniverses]);

  // Check for authentication and load data on component mount
  useEffect(() => {
    // First check if this is a demo session
    const isDemoSession = demoUserService.isDemoSession();
    
    if (isDemoSession) {
      console.log("Dashboard - Demo session detected, ensuring tokens are set");
      // Ensure demo tokens are properly set up
      if (!localStorage.getItem(AUTH_CONFIG.TOKEN_KEY) || !localStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_KEY)) {
        console.log("Demo tokens missing, regenerating");
        demoUserService.setupDemoSession();
      }
      // Proceed to load universes
      loadUniverses();
      return;
    }
    
    // Not in demo mode, check regular auth
    if (!isAuthenticated) {
      console.log("Not authenticated, redirecting to login");
      navigate("/?modal=login", { replace: true });
      return;
    }
    
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    if (!token) {
      console.log("No token found, redirecting to login");
      dispatch(logout());
      navigate("/?modal=login", { replace: true });
      return;
    }
    
    console.log("Dashboard - Fetching universes...");
    loadUniverses();
  }, [isAuthenticated, dispatch, navigate, loadUniverses]);

  // Consistent logout handler that uses the auth service
  const handleLogout = () => {
    const now = Date.now();
    
    if (now - lastDashboardLogoutAttempt < DASHBOARD_LOGOUT_COOLDOWN) {
      console.log("Dashboard - Logout throttled (multiple attempts)");
      return;
    }
    
    lastDashboardLogoutAttempt = now;
    
    console.log("Dashboard - Logging out user");
    authService.clearAuthData();
    dispatch(logout());
    navigate("/?modal=login", { replace: true });
  };

  // Reset authentication and redirect to login
  const handleResetAuth = () => {
    console.log("Dashboard - Resetting authentication state");
    authService.resetAuth();
    dispatch(logout());
    navigate("/?modal=login", { replace: true });
  };

  const handleCreateClick = () => {
    console.log("Dashboard - Create button clicked");
    setIsCreateModalOpen(true);
  };

  const handleCreateSuccess = (universe) => {
    console.log("Dashboard - Create success with universe:", universe);
    setIsCreateModalOpen(false);

    if (universe && universe.id) {
      setNewUniverseId(universe.id);
    }

    loadUniverses();
  };

  const handleViewUniverse = (universe) => {
    console.log("Viewing universe:", universe);
    navigate(`/universes/${universe.id}`);
  };

  const handleEditUniverse = (universe) => {
    console.log("Editing universe:", universe);
    setSelectedUniverse(universe);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = (updatedUniverse) => {
    console.log("Universe updated:", updatedUniverse);
    setIsEditModalOpen(false);
    setSelectedUniverse(null);
    loadUniverses();
  };

  const handleDeleteUniverse = (universe) => {
    console.log("Deleting universe:", universe);
    setSelectedUniverse(universe);
    setIsDeleteModalOpen(true);
  };

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

  const getSortedUniverses = () => {
    if (!universes || !Array.isArray(universes)) {
      return [];
    }

    let filteredUniverses = [...universes];

    if (filterOption === "public") {
      filteredUniverses = filteredUniverses.filter((u) => u.is_public);
    } else if (filterOption === "private") {
      filteredUniverses = filteredUniverses.filter((u) => !u.is_public);
    }

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
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleLogout}
            >
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
