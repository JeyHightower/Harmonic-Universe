import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Box,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import apiClient from "../services/api";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchScenes,
  deleteScene,
} from "../store/thunks/consolidated/scenesThunks";
import { SceneFormModal } from "../components/modals";

// Create a wrapper component that handles redirection logic
const ScenesPageWrapper = () => {
  const { universeId } = useParams();
  const navigate = useNavigate();
  const [isValidating, setIsValidating] = useState(true);

  // Add debug logging
  useEffect(() => {
    console.log("ScenesPageWrapper: universeId from params:", universeId);
  }, [universeId]);

  // Validate the universeId immediately when component mounts
  useEffect(() => {
    // Comprehensive validation check for universeId
    const isValidUniverseId =
      universeId !== undefined &&
      universeId !== null &&
      universeId !== "undefined" &&
      universeId !== "null" &&
      universeId !== "" &&
      !isNaN(parseInt(universeId, 10)) &&
      parseInt(universeId, 10) > 0;

    console.log("ScenesPageWrapper: isValidUniverseId =", isValidUniverseId);

    if (!isValidUniverseId) {
      console.log(
        `Invalid universe ID detected (${universeId}), redirecting to dashboard`
      );
      navigate("/dashboard", { replace: true });
    } else {
      setIsValidating(false);
    }
  }, [universeId, navigate]);

  // Show loading while validating
  if (isValidating) {
    return (
      <Box display="flex" justifyContent="center" my={6}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Validating universe...
        </Typography>
      </Box>
    );
  }

  // Validation is complete and universeId is valid
  // Parse universeId to make sure it's a number
  const parsedUniverseId = parseInt(universeId, 10);
  console.log(
    `ScenesPageWrapper: Rendering for valid universe ID: ${parsedUniverseId}`
  );

  // If universeId is valid, render the main component
  return <ScenesPageContent universeId={parsedUniverseId} />;
};

// Main component with actual content
const ScenesPageContent = ({ universeId }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Add more comprehensive debug logging
  console.log("ScenesPageContent props:", { universeId });

  // Double-check universeId is valid, even after wrapper validation
  const safeUniverseId =
    universeId && !isNaN(universeId) && universeId > 0 ? universeId : null;

  // Add more debug logging
  console.log("Calculated safeUniverseId:", safeUniverseId);
  console.log("Type of safeUniverseId:", typeof safeUniverseId);

  // Get scenes from Redux store
  const scenesFromStore = useSelector((state) => state.scenes?.scenes || []);
  const loadingFromStore = useSelector((state) => state.scenes?.loading);
  const errorFromStore = useSelector((state) => state.scenes?.error);

  const [scenes, setScenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [universe, setUniverse] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("create");
  const [selectedSceneId, setSelectedSceneId] = useState(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");

  // Update local state when Redux state changes
  useEffect(() => {
    if (scenesFromStore) {
      setScenes(scenesFromStore);
    }
    if (loadingFromStore !== undefined) {
      setLoading(loadingFromStore);
    }
    if (errorFromStore) {
      setError(errorFromStore);
    }
  }, [scenesFromStore, loadingFromStore, errorFromStore]);

  useEffect(() => {
    // Early return to prevent any API calls if universeId is invalid or null
    if (!safeUniverseId) {
      console.warn(
        `Invalid universeId for API calls: ${universeId}, skipping data fetch`
      );
      setLoading(false);
      setError("Invalid universe ID. Redirecting to dashboard.");
      // Additional safety - redirect if we somehow got here with an invalid ID
      setTimeout(() => navigate("/dashboard", { replace: true }), 1500);
      return;
    }

    const fetchData = async () => {
      try {
        console.log(`Fetching data for valid universe ID: ${safeUniverseId}`);
        setLoading(true);
        setError(null);

        // Get universe details
        try {
          // Make sure you're passing the ID directly, not as an object
          console.log("About to call getUniverse with:", safeUniverseId);
          console.log("Type of ID being passed:", typeof safeUniverseId);

          // Ensure we're passing the ID directly, not wrapped in an object
          const universeResponse = await apiClient.getUniverse(safeUniverseId);
          console.log("Universe response:", universeResponse);

          // Add null checks before accessing data
          if (!universeResponse || !universeResponse.data) {
            console.error("Empty response from getUniverse API");
            throw new Error("Failed to fetch universe data");
          }

          // Set universe with fallback to empty object if undefined
          const universeData = universeResponse.data.universe || {};
          console.log("Extracted universe data:", universeData);
          setUniverse(universeData);
        } catch (universeError) {
          console.error("Error fetching universe:", universeError);
          setError("Failed to fetch universe details. Please try again.");
          setLoading(false);
          return;
        }

        // Fetch scenes for the universe
        try {
          // Make sure you're passing the ID directly
          console.log("About to call fetchScenes with:", safeUniverseId);
          await dispatch(fetchScenes(safeUniverseId));
        } catch (scenesError) {
          console.error("Error fetching scenes:", scenesError);
          setError("Failed to fetch scenes. Please try again.");
        }

        setLoading(false);
      } catch (error) {
        console.error("General error in fetchData:", error);
        setError("An unexpected error occurred. Please try again.");
        setLoading(false);
      }
    };

    fetchData();
  }, [dispatch, navigate, safeUniverseId, universeId]);

  const handleCreateScene = () => {
    setModalType("create");
    setSelectedSceneId(null);
    setModalOpen(true);
  };

  const handleEditScene = (sceneId) => {
    setModalType("edit");
    setSelectedSceneId(sceneId);
    setModalOpen(true);
  };

  const handleViewScene = (sceneId) => {
    navigate(`/scenes/${sceneId}`);
  };

  const handleDeleteScene = async (sceneId) => {
    if (window.confirm("Are you sure you want to delete this scene?")) {
      try {
        // Use the Redux thunk instead of directly calling the API
        await dispatch(deleteScene(sceneId)).unwrap();
        console.log(`Scene ${sceneId} deleted successfully`);

        // Refresh the scenes list for this universe
        dispatch(fetchScenes(safeUniverseId));
      } catch (error) {
        console.error("Error deleting scene:", error);
        setError("Failed to delete scene. Please try again.");
      }
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
  };

  const handleBackToUniverse = () => {
    navigate(`/universes/${safeUniverseId}`);
  };

  // Filter and sort scenes
  const filteredScenes = useMemo(() => {
    let result = scenes;

    // Filter scenes by universe ID
    result = result.filter(
      (scene) => scene && scene.universe_id === safeUniverseId
    );

    // Filter out deleted scenes
    result = result.filter((scene) => scene && scene.is_deleted !== true);

    // Apply search filter if search term is present
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (scene) =>
          scene.name?.toLowerCase().includes(term) ||
          scene.description?.toLowerCase().includes(term) ||
          scene.content?.toLowerCase().includes(term) ||
          scene.summary?.toLowerCase().includes(term) ||
          scene.location?.toLowerCase().includes(term)
      );
    }

    // Apply type filter if not set to "all"
    if (typeFilter && typeFilter !== "all") {
      result = result.filter((scene) => scene.scene_type === typeFilter);
    }

    // Apply status filter if not set to "all"
    if (statusFilter && statusFilter !== "all") {
      result = result.filter((scene) => scene.status === statusFilter);
    }

    // Apply sort
    if (sortBy) {
      result = [...result].sort((a, b) => {
        if (sortBy === "name") {
          return sortDirection === "asc"
            ? (a.name || "").localeCompare(b.name || "")
            : (b.name || "").localeCompare(a.name || "");
        } else if (sortBy === "date_of_scene") {
          // Sorting by scene date
          const aDate = a.date_of_scene
            ? new Date(a.date_of_scene)
            : new Date(0);
          const bDate = b.date_of_scene
            ? new Date(b.date_of_scene)
            : new Date(0);
          return sortDirection === "asc" ? aDate - bDate : bDate - aDate;
        } else if (sortBy === "created_at") {
          // Sorting by creation date
          const aDate = a.created_at ? new Date(a.created_at) : new Date(0);
          const bDate = b.created_at ? new Date(b.created_at) : new Date(0);
          return sortDirection === "asc" ? aDate - bDate : bDate - aDate;
        } else if (sortBy === "updated_at") {
          // Sorting by update date
          const aDate = a.updated_at ? new Date(a.updated_at) : new Date(0);
          const bDate = b.updated_at ? new Date(b.updated_at) : new Date(0);
          return sortDirection === "asc" ? aDate - bDate : bDate - aDate;
        } else if (sortBy === "order") {
          // Sorting by order field (numeric)
          const aOrder = typeof a.order === "number" ? a.order : 0;
          const bOrder = typeof b.order === "number" ? b.order : 0;
          return sortDirection === "asc" ? aOrder - bOrder : bOrder - aOrder;
        }
        return 0;
      });
    }

    return result;
  }, [
    scenes,
    searchTerm,
    typeFilter,
    statusFilter,
    sortBy,
    sortDirection,
    safeUniverseId,
  ]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" my={6}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/dashboard")}
        >
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Box>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBackToUniverse}
            sx={{ mb: 2 }}
          >
            Back to Universe
          </Button>
          <Typography variant="h4" component="h1" gutterBottom>
            {universe?.title || "Universe"} Scenes
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateScene}
        >
          Create Scene
        </Button>
      </Box>

      <TextField
        fullWidth
        margin="normal"
        placeholder="Search scenes..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 4 }}
      />

      {filteredScenes.length === 0 ? (
        <Box textAlign="center" my={6}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No scenes found
          </Typography>
          <Typography variant="body1" color="textSecondary">
            {searchTerm
              ? "No scenes match your search criteria."
              : "Start by creating your first scene!"}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredScenes.map((scene) => (
            <Grid item xs={12} sm={6} md={4} key={scene.id}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.2s",
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: 3,
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h5" component="h2" gutterBottom noWrap>
                    {scene.title || scene.name || "Untitled Scene"}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{
                      mb: 2,
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {scene.description || "No description available"}
                  </Typography>
                </CardContent>
                <CardActions>
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => handleViewScene(scene.id)}
                    title="View Scene"
                  >
                    <ViewIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="secondary"
                    onClick={() => handleEditScene(scene.id)}
                    title="Edit Scene"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteScene(scene.id)}
                    title="Delete Scene"
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {modalOpen && (
        <SceneFormModal
          isOpen={modalOpen}
          onClose={handleModalClose}
          universeId={safeUniverseId}
          sceneId={selectedSceneId}
          modalType={modalType}
          onSuccess={(type, data) => {
            console.log(`Scene ${type} successful:`, data);
            // Refresh scenes list
            dispatch(fetchScenes(safeUniverseId));
          }}
        />
      )}
    </Container>
  );
};

export default ScenesPageWrapper;
