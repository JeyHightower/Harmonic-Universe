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
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>{universe ? 'Edit Universe' : 'Create Universe'}</DialogTitle>
    <DialogContent>
      <p>This is a placeholder for the universe modal</p>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
      <Button onClick={() => onSuccess({ id: 123, name: 'New Universe' })}>Save</Button>
    </DialogActions>
  </Dialog>
);

import { fetchUniverses } from "../../../store/thunks/universeThunks";
import { deleteUniverse } from "../../../store/thunks/universeThunks";
import { AUTH_CONFIG } from "../../../utils/config";
import { logout } from "../../../store/thunks/authThunks";

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

  // Enhanced function to load universes with better error handling and logging
  const loadUniverses = useCallback(() => {
    console.log("Dashboard - Loading universes, attempt:", retryCount + 1);
    return dispatch(fetchUniverses({ userId: user?.id, user_only: true }))
      .then((result) => {
        console.log("Dashboard - Fetch universes result:", {
          payload: result.payload,
          error: result.error,
          meta: result.meta,
        });
        if (!result.payload) {
          console.warn("Dashboard - No payload in result:", result);
          if (retryCount < 3) {
            console.log("Dashboard - Retrying fetch...");
            setRetryCount((prev) => prev + 1);
          }
          return { error: "No data received from server" };
        }

        // Handle different response formats
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

        console.log("Dashboard - Processed universes:", {
          count: universes.length,
          isArray: Array.isArray(universes),
          hasData: !!universes,
        });

        return { universes };
      })
      .catch((error) => {
        console.error("Dashboard - Error loading universes:", {
          error: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });
        return { error: error.message };
      });
  }, [dispatch, retryCount, user?.id]);

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
    } else {
      // Fetch universes when component mounts or retry is triggered
      console.log("Dashboard - Fetching universes...");
      loadUniverses();
    }
  }, [navigate, loadUniverses, retryCount, isAuthenticated]);

  // Clear new universe highlight after delay
  useEffect(() => {
    if (newUniverseId) {
      const timer = setTimeout(() => {
        setNewUniverseId(null);
      }, 5000); // Clear after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [newUniverseId]);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
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
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onSuccess={handleCreateSuccess}
          />
        )}
      </div>
    );
  }

  // Show error state if there are errors but we have some universes
  if (error && universes?.length) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <Typography variant="h4" component="h1">
            Your Universes
          </Typography>
          <div className="dashboard-actions">
            <Tooltip content="Refresh universe list" position="bottom">
              <Button
                variant="outlined"
                color="primary"
                onClick={loadUniverses}
                startIcon={<RefreshIcon />}
                disabled={loading}
              >
                Refresh
              </Button>
            </Tooltip>
            <Tooltip content="Create a new universe" position="bottom">
              <Button
                variant="contained"
                color="primary"
                onClick={handleCreateClick}
                startIcon={<AddIcon />}
              >
                Create Universe
              </Button>
            </Tooltip>
            <Tooltip content="Log out of your account" position="bottom">
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleLogout}
                startIcon={<LogoutIcon />}
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

          <Tooltip
            content="Sort universes by different criteria"
            position="top"
          >
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
        <Typography color="error" className="error-message">
          {typeof error === "object" ? JSON.stringify(error) : error}
        </Typography>
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
        {/* Modals */}
        {renderModals()}
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
          <Tooltip content="Refresh universe list" position="bottom">
            <Button
              variant="outlined"
              color="primary"
              onClick={loadUniverses}
              startIcon={<RefreshIcon />}
              disabled={loading}
            >
              Refresh
            </Button>
          </Tooltip>
          <Tooltip content="Create a new universe" position="bottom">
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreateClick}
              startIcon={<AddIcon />}
            >
              Create Universe
            </Button>
          </Tooltip>
          <Tooltip content="Log out of your account" position="bottom">
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleLogout}
              startIcon={<LogoutIcon />}
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
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onSuccess={handleCreateSuccess}
          />
        )}
        {isEditModalOpen && selectedUniverse && (
          <UniverseModal
            isOpen={isEditModalOpen}
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
