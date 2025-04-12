import React, { useEffect, useState, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Grid,
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  IconButton,
  Tooltip,
  MenuItem,
} from "@mui/material";
import { Add as AddIcon, Refresh as RefreshIcon } from "@mui/icons-material";
import {
  fetchScenes,
  deleteScene,
  createScene,
} from "../../../store/thunks/consolidated/scenesThunks";
import { addScene } from "../../../store/slices/scenesSlice";
import { ROUTES } from "../../../utils/routes";
import SceneCard from "../components/SceneCard";
import SceneModal from "../modals/SceneModal";
import apiClient from "../../../services/api.adapter";
import "../styles/SceneList.css";

// Define a fallback for process.env if it's not available in the environment
const processEnv = { NODE_ENV: import.meta.env.PROD ? 'production' : 'development' };

// Production environment detection
const IS_PRODUCTION =
  processEnv.NODE_ENV === "production" ||
  import.meta.env.PROD ||
  (typeof window !== "undefined" &&
    !window.location.hostname.includes("localhost") &&
    !window.location.hostname.includes("127.0.0.1"));

const SceneList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { universeId } = useParams();

  // Add safe destructuring with default values to prevent undefined errors
  const {
    scenes = [],
    locallyCreatedScenes = [],
    universeScenes = {},
    loading = false,
    error = null,
  } = useSelector(
    (state) =>
      state.scenes || {
        scenes: [],
        locallyCreatedScenes: [],
        universeScenes: {},
        loading: false,
        error: null,
      }
  );
  const { user } = useSelector((state) => state.auth || {});

  // Use universe-specific scenes when available, otherwise fallback to main scenes list
  const currentUniverseScenes =
    universeId && universeScenes[universeId]
      ? universeScenes[universeId]
      : scenes.filter((scene) => scene && scene.universe_id === universeId);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [sceneToDelete, setSceneToDelete] = useState(null);
  const [sceneToEdit, setSceneToEdit] = useState(null);
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("updated_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [forceRender, setForceRender] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [selectedSceneId, setSelectedSceneId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortDirection, setSortDirection] = useState("desc");
  const [localError, setError] = useState(null);

  // Safe log that won't break if something is undefined
  console.log("SceneList: Rendering with data:", {
    universeId,
    allScenesCount: (scenes || []).length,
    universeSpecificCount: (currentUniverseScenes || []).length,
    locallyCreatedCount: (locallyCreatedScenes || []).filter(
      (s) => s && s.universe_id === universeId
    ).length,
    reduxStateAvailable: !!scenes,
    hasUniverseScenes: !!universeScenes[universeId],
    universeSceneIds: universeScenes[universeId]?.map((s) => s.id),
  });

  useEffect(() => {
    if (universeId) {
      console.log("SceneList: Fetching scenes for universe:", universeId);
      // Safely handle promise to prevent errors if dispatch returns unexpected results
      const fetchPromise = dispatch(fetchScenes(universeId));
      if (fetchPromise && typeof fetchPromise.then === "function") {
        fetchPromise
          .then((result) => {
            console.log("SceneList: Scenes fetch completed:", result);
            console.log("SceneList: Raw payload data:", result.payload);
            if (result.payload && result.payload.scenes) {
              console.log(
                "SceneList: Non-deleted scenes:",
                result.payload.scenes.filter((s) => s && s.is_deleted !== true)
                  .length
              );
            }
            console.log("SceneList: Current scenes in store:", scenes || []);

            // Ensure universeScenes for this universe is up to date
            if (result?.payload?.scenes) {
              console.log(
                "SceneList: Updating universeScenes from fetch result"
              );

              // Make sure is_deleted is explicitly set to false for all scenes
              const normalizedScenes = result.payload.scenes.map((scene) => ({
                ...scene,
                is_deleted: scene.is_deleted === true ? true : false,
              }));

              dispatch({
                type: "scenes/fetchScenes/fulfilled",
                payload: { scenes: normalizedScenes },
                meta: { arg: universeId },
              });
            }
          })
          .catch((err) => {
            console.error("SceneList: Error fetching scenes:", err);
          });
      } else {
        console.warn(
          "SceneList: dispatch did not return a promise as expected"
        );
      }
    }
  }, [dispatch, universeId, forceRender, fetchScenes]);

  // Add hook to ensure persisted scenes are in the current universe scenes
  useEffect(() => {
    // Check if we have locally created scenes for this universe that need to be synced
    if (universeId && locallyCreatedScenes.length > 0) {
      console.log(
        "SceneList: Ensuring locally created scenes are in universe scenes"
      );

      // Filter locally created scenes for this universe
      const universeLocalScenes = locallyCreatedScenes.filter(
        (scene) => scene && scene.universe_id === universeId
      );

      if (universeLocalScenes.length > 0) {
        console.log(
          `SceneList: Found ${universeLocalScenes.length} locally created scenes for universe ${universeId}`
        );

        // If universeScenes doesn't exist for this universe, ensure it's initialized
        if (!universeScenes[universeId]) {
          console.log(
            "SceneList: Initializing universe scenes from locally created scenes"
          );
          dispatch({
            type: "scenes/fetchScenes/fulfilled",
            payload: { scenes: universeLocalScenes },
            meta: { arg: universeId },
          });
        }
      }
    }
  }, [universeId, locallyCreatedScenes, universeScenes, dispatch, scenes]);

  const handleCreateScene = () => {
    console.log("Opening create scene modal");
    setModalType("create");
    setSelectedSceneId(null);
    setModalOpen(true);
  };

  const handleEditScene = (sceneId) => {
    console.log("Opening edit scene modal for scene:", sceneId);
    setModalType("edit");
    setSelectedSceneId(sceneId);
    setModalOpen(true);
  };

  const handleViewScene = (sceneId) => {
    console.log("Navigating to scene view:", sceneId);
    if (universeId) {
      navigate(`/universes/${universeId}/scenes/${sceneId}`);
    } else {
      navigate(`/scenes/${sceneId}`);
    }
  };

  const handleDeleteScene = async (sceneId) => {
    if (window.confirm("Are you sure you want to delete this scene?")) {
      try {
        await apiClient.deleteScene(sceneId);
        // Refresh the scenes list
        dispatch(fetchScenes(universeId));
      } catch (error) {
        console.error("Error deleting scene:", error);
        setError("Failed to delete scene. Please try again.");
      }
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setModalType(null);
    setSelectedSceneId(null);
  };

  const handleModalSuccess = (scene) => {
    console.log("Scene operation successful:", scene);
    // Refresh the scenes list
    dispatch(fetchScenes(universeId));
    handleModalClose();
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const handleSortOrderToggle = () => {
    setSortDirection(sortDirection === "asc" ? "desc" : "asc");
  };

  const handleEditClick = (scene) => {
    // Use ROUTES constant to ensure correct path pattern
    const editPath = ROUTES.SCENE_EDIT.replace(
      ":universeId",
      universeId
    ).replace(":sceneId", scene.id);

    console.log("Navigating to scene edit path:", editPath);
    navigate(editPath);
  };

  // Sort and filter scenes
  const { filteredAndSortedScenes, activeScenes, deletedScenes } =
    useMemo(() => {
      // Check if we have a valid scenes array
      if (!Array.isArray(scenes)) {
        console.warn("SceneList: scenes is not an array", scenes);
        return {
          filteredAndSortedScenes: [],
          activeScenes: [],
          deletedScenes: [],
        };
      }

      // Initialize with all scenes that are not null/undefined
      let workingScenes = scenes.filter((scene) => !!scene);

      // Separate deleted and active scenes
      const deletedScenes = workingScenes.filter(
        (scene) => scene.is_deleted === true
      );
      const activeScenes = workingScenes.filter(
        (scene) => scene.is_deleted !== true
      );

      // Copy the active scenes to work with
      let result = [...activeScenes];

      // Apply search filter if we have a search term
      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        result = result.filter((scene) => {
          return (
            scene.name?.toLowerCase().includes(lowerQuery) ||
            scene.description?.toLowerCase().includes(lowerQuery) ||
            scene.summary?.toLowerCase().includes(lowerQuery) ||
            scene.content?.toLowerCase().includes(lowerQuery) ||
            scene.location?.toLowerCase().includes(lowerQuery) ||
            scene.notes?.toLowerCase().includes(lowerQuery)
          );
        });
      }

      // Apply status filter
      if (statusFilter && statusFilter !== "all") {
        result = result.filter((scene) => scene.status === statusFilter);
      }

      // Apply scene type filter
      if (typeFilter && typeFilter !== "all") {
        result = result.filter((scene) => scene.scene_type === typeFilter);
      }

      // Apply sort
      if (sortBy) {
        result = [...result].sort((a, b) => {
          // For string fields
          if (
            sortBy === "name" ||
            sortBy === "status" ||
            sortBy === "scene_type" ||
            sortBy === "location"
          ) {
            const aValue = String(a[sortBy] || "").toLowerCase();
            const bValue = String(b[sortBy] || "").toLowerCase();
            return sortDirection === "asc"
              ? aValue.localeCompare(bValue)
              : bValue.localeCompare(aValue);
          }
          // For date fields
          else if (
            sortBy === "date_of_scene" ||
            sortBy === "created_at" ||
            sortBy === "updated_at"
          ) {
            const aDate = a[sortBy] ? new Date(a[sortBy]) : new Date(0);
            const bDate = b[sortBy] ? new Date(b[sortBy]) : new Date(0);
            return sortDirection === "asc" ? aDate - bDate : bDate - aDate;
          }
          // For numeric fields
          else if (sortBy === "order" || sortBy === "id") {
            const aValue = Number(a[sortBy] || 0);
            const bValue = Number(b[sortBy] || 0);
            return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
          }
          return 0;
        });
      }

      return {
        filteredAndSortedScenes: result,
        activeScenes,
        deletedScenes,
      };
    }, [scenes, searchQuery, statusFilter, typeFilter, sortBy, sortDirection]);

  // Add logging to inspect the scenes
  console.log("SceneList: Final filtered and sorted scenes to display:", {
    totalCount: filteredAndSortedScenes.length,
    scenes: filteredAndSortedScenes.map((scene) => ({
      id: scene.id,
      name: scene.name,
      is_deleted: scene.is_deleted,
      universe_id: scene.universe_id,
    })),
  });

  // Log the universe scenes data for debugging
  useEffect(() => {
    if (universeId && universeScenes[universeId]) {
      console.log(`SceneList: Universe ${universeId} scenes data:`, {
        total: universeScenes[universeId].length,
        nonDeleted: universeScenes[universeId].filter(
          (s) => s.is_deleted !== true
        ).length,
        deleted: universeScenes[universeId].filter((s) => s.is_deleted === true)
          .length,
      });
    }
  }, [universeId, universeScenes]);

  // Add debug function to force refresh and log scene state
  const debugForceRefresh = () => {
    console.log("====== DEBUG: FORCE REFRESHING SCENES ======");
    console.log("Current scenes state:", {
      scenes,
      universeScenes,
      currentUniverseScenes,
      locallyCreatedScenes,
    });

    // Increment forceRender to trigger UI update
    setForceRender((prev) => prev + 1);

    // Force fetch from server
    dispatch(fetchScenes(universeId)).then((result) => {
      console.log("DEBUG: Forced refresh result:", result);

      // Add debug info to help understand scene visibility issues
      if (result?.payload?.scenes) {
        const allScenes = result.payload.scenes;
        const activeScenes = allScenes.filter(
          (s) => s && s.is_deleted !== true
        );
        const deletedScenes = allScenes.filter(
          (s) => s && s.is_deleted === true
        );

        console.log("DEBUG SCENES ANALYSIS:", {
          total: allScenes.length,
          active: activeScenes.length,
          deleted: deletedScenes.length,
          activeSceneIds: activeScenes.map((s) => s.id),
          deletedSceneIds: deletedScenes.map((s) => s.id),
        });
      }
    });

    console.log("===========================================");
  };

  if (loading) {
    return (
      <Container className="scene-list-container">
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="200px"
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="scene-list-container">
        <Alert severity="error" sx={{ mt: 2 }}>
          {typeof error === "object"
            ? error.message || "An unknown error occurred"
            : error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="scene-list-container">
      <Box className="scene-list-header">
        <Typography variant="h4" component="h1">
          Scenes
        </Typography>
        <Box className="scene-list-actions">
          <Box className="filter-buttons">
            <Button
              variant={filter === "all" ? "contained" : "outlined"}
              size="small"
              onClick={() => setFilter("all")}
            >
              All
            </Button>
            <Button
              variant={filter === "active" ? "contained" : "outlined"}
              size="small"
              onClick={() => setFilter("active")}
            >
              Active
            </Button>
            <Button
              variant={filter === "inactive" ? "contained" : "outlined"}
              size="small"
              onClick={() => setFilter("inactive")}
            >
              Inactive
            </Button>

            {/* Add debug refresh button */}
            <Tooltip title="Force Refresh Scenes">
              <IconButton
                color="primary"
                size="small"
                onClick={debugForceRefresh}
                sx={{ ml: 1 }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>

          <Box className="sort-controls">
            <TextField
              select
              label="Sort By"
              value={sortBy}
              onChange={handleSortChange}
              size="small"
              sx={{ minWidth: "120px", mr: 1 }}
            >
              <MenuItem value="name">Name</MenuItem>
              <MenuItem value="created_at">Created</MenuItem>
              <MenuItem value="updated_at">Updated</MenuItem>
            </TextField>
            <FormControlLabel
              control={
                <Switch
                  checked={sortDirection === "desc"}
                  onChange={handleSortOrderToggle}
                  name="sortDesc"
                  size="small"
                />
              }
              label="Desc"
            />
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
      </Box>

      {/* Create scene modal */}
      <SceneModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        onSubmit={handleCreateScene}
        initialData={{
          name: "",
          description: "",
          isPublic: false,
          universeId,
        }}
        creating={true}
      />

      {/* Edit scene modal */}
      <SceneModal
        isOpen={sceneToEdit !== null}
        onClose={() => setSceneToEdit(null)}
        onSubmit={handleEditScene}
        initialData={sceneToEdit || {}}
        editing={true}
      />

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!sceneToDelete}
        onClose={() => setSceneToDelete(null)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete scene &quot;
            {sceneToDelete ? sceneToDelete.name || sceneToDelete.title : ""}
            &quot;? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSceneToDelete(null)} color="primary">
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (sceneToDelete) {
                dispatch(deleteScene(sceneToDelete.id));
                setSceneToDelete(null);
                dispatch(fetchScenes(universeId));
              }
            }}
            color="error"
            variant="contained"
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Debug Section - makes diagnosing issues easier */}
      <Box
        sx={{
          mt: 4,
          p: 2,
          border: "1px dashed #ccc",
          borderRadius: 1,
          display: IS_PRODUCTION ? "none" : "block",
        }}
      >
        <Typography variant="h6">Debug Information</Typography>
        <Typography variant="body2">Universe ID: {universeId}</Typography>
        <Typography variant="body2">
          Scenes Count: {(currentUniverseScenes || []).length}
        </Typography>
        <Typography variant="body2">
          Filtered Scenes Count: {filteredAndSortedScenes.length}
        </Typography>
        <Typography variant="body2">
          Scenes in Redux Store: {(scenes || []).length}
        </Typography>
        <Typography variant="body2">
          Local Scenes: {(locallyCreatedScenes || []).length}
        </Typography>

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2">Raw Scene Data:</Typography>
          <Box
            component="pre"
            sx={{
              mt: 1,
              maxHeight: 200,
              overflow: "auto",
              fontSize: "12px",
              p: 1,
              bgcolor: "#eaeaea",
              borderRadius: 1,
            }}
          >
            {JSON.stringify(currentUniverseScenes || [], null, 2)}
          </Box>
        </Box>
      </Box>

      {filteredAndSortedScenes.length > 0 ? (
        <Grid container spacing={3} className="scene-grid">
          {filteredAndSortedScenes.map((scene) => (
            <Grid item xs={12} sm={6} md={4} key={scene.id}>
              <SceneCard
                scene={scene}
                onDelete={() => setSceneToDelete(scene)}
                onEdit={() => setSceneToEdit(scene)}
                isOwner={user?.id === scene.universe?.user_id}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="200px"
          mt={4}
        >
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No scenes found
          </Typography>
          <Typography variant="body1" color="textSecondary" gutterBottom>
            Get started by creating your first scene
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreateScene}
            sx={{ mt: 2 }}
          >
            Create Scene
          </Button>
        </Box>
      )}
    </Container>
  );
};

export default SceneList;
