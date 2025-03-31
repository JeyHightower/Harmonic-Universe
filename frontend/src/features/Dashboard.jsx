import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Tooltip from "../components/common/Tooltip";
import UniverseCard from "../components/universe/UniverseCard";
import { fetchUniverses } from "../store/universeThunks";
import "../styles/Dashboard.css";
import { AUTH_CONFIG } from "../utils/config";
import UniverseFormModal from "./UniverseFormModal";
import { logout } from "../store/thunks/authThunks";
import { Button } from "@mui/material";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  AppBar,
  Toolbar,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Search as SearchIcon,
  Sort as SortIcon,
  FilterList as FilterIcon,
  Logout as LogoutIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import {
  createUniverse,
  updateUniverse,
  deleteUniverse,
} from "../store/thunks/universeThunks";
import { log } from "../utils/logger";

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { universes, loading, error } = useSelector((state) => state.universe);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [sortOption, setSortOption] = useState("updated_at");
  const [filterOption, setFilterOption] = useState("all");
  const [newUniverseId, setNewUniverseId] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // Enhanced function to load universes with better error handling and logging
  const loadUniverses = useCallback(() => {
    console.log("Dashboard - Loading universes, attempt:", retryCount + 1);
    return dispatch(fetchUniverses({ userId: user?.id })) // Only fetch user's universes
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
          data: universes,
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

  useEffect(() => {
    console.log("Dashboard - Component mounted, loading universes");
    loadUniverses();
  }, [loadUniverses]);

  useEffect(() => {
    console.log("Dashboard - State updated:", {
      universesCount: universes?.length,
      loading,
      error,
      isAuthenticated,
    });
  }, [universes, loading, error, isAuthenticated]);

  // Debug log to check universes data - enhanced with more detail
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
    setIsCreateModalOpen(true);
  };

  const handleCreateSuccess = (universe) => {
    console.log("Dashboard - Create success with universe:", universe);
    setIsCreateModalOpen(false);

    // Set the new universe ID to highlight it
    if (universe && universe.id) {
      setNewUniverseId(universe.id);
    }

    // Refresh the list after creating a new universe
    setTimeout(() => {
      loadUniverses();
    }, 100);
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

  // Render error state
  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-message">
          <Alert severity="error">
            Error loading universes:{" "}
            {typeof error === "object" ? JSON.stringify(error) : error}
          </Alert>
          <Button
            variant="contained"
            color="primary"
            onClick={loadUniverses}
            startIcon={<RefreshIcon />}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Render empty state
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
      </div>
    );
  }

  // Render universes grid
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <Typography variant="h4" component="h1">
          Your Universes
        </Typography>
        <div className="dashboard-actions">
          <Button
            variant="contained"
            color="primary"
            onClick={handleCreateClick}
            startIcon={<AddIcon />}
          >
            Create Universe
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
          >
            Logout
          </Button>
        </div>
      </div>
      <div className="universes-grid">
        {universes.map((universe) => (
          <UniverseCard
            key={universe.id}
            universe={universe}
            isNew={universe.id === newUniverseId}
          />
        ))}
      </div>
      {isCreateModalOpen && (
        <UniverseFormModal
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateSuccess}
        />
      )}
    </div>
  );
};

export default Dashboard;
