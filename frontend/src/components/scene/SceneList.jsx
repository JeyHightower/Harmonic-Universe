import React, { useEffect, useState, useRef } from "react";
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
} from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import {
  fetchScenes,
  deleteScene,
  createScene,
} from "../../store/thunks/consolidated/scenesThunks";
import { SceneCard } from "../consolidated";
import SceneFormModal from "../scene/SceneFormModal";
import { ROUTES } from "../../utils/routes";
import "../../styles/SceneList.css";

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

  // Safe log that won't break if something is undefined
  console.log("SceneList: Rendering with data:", {
    universeId,
    allScenesCount: (scenes || []).length,
    universeSpecificCount: (currentUniverseScenes || []).length,
    locallyCreatedCount: (locallyCreatedScenes || []).filter(
      (s) => s && s.universe_id === universeId
    ).length,
    reduxStateAvailable: !!scenes,
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
            console.log("SceneList: Current scenes in store:", scenes || []);
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
  }, [dispatch, universeId, forceRender]);

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
  }, [universeId, locallyCreatedScenes, universeScenes, dispatch]);

  const handleCreateClick = () => {
    setIsCreateModalOpen(true);
  };

  const handleCreateSuccess = (actionType, sceneData) => {
    console.log(
      "SceneList: Scene creation success! Closing modal and refreshing scenes for universe:",
      universeId
    );
    console.log("SceneList: New scene data:", sceneData);

    // Close the modal first
    setIsCreateModalOpen(false);

    // Force render to ensure UI update
    setForceRender((prev) => prev + 1);

    // Make sure we're on the scenes list page
    const targetPath = `/universes/${universeId}/scenes`;
    if (window.location.pathname !== targetPath) {
      console.log(`SceneList: Navigating to scenes list page: ${targetPath}`);
      navigate(targetPath, { replace: true });
    }
  };

  const handleDeleteClick = (scene) => {
    setSceneToDelete(scene);
  };

  const handleDeleteConfirm = async () => {
    if (sceneToDelete) {
      await dispatch(deleteScene(sceneToDelete.id));
      setSceneToDelete(null);
      dispatch(fetchScenes(universeId));
    }
  };

  const handleDeleteCancel = () => {
    setSceneToDelete(null);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const handleSortOrderToggle = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
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

  // Filter and sort scenes with null safety
  const filteredAndSortedScenes = [...(currentUniverseScenes || [])]
    .filter((scene) => {
      if (!scene) return false;

      // Apply user-selected filters (universe filtering is already done)
      if (filter === "all") return true;
      if (filter === "active") return !!scene.is_active;
      if (filter === "inactive") return !scene.is_active;
      return true;
    })
    .sort((a, b) => {
      if (!a || !b) return 0;
      let comparison = 0;

      switch (sortBy) {
        case "name":
          comparison = (a.name || "").localeCompare(b.name || "");
          break;
        case "created_at":
          comparison =
            new Date(a.created_at || 0) - new Date(b.created_at || 0);
          break;
        case "updated_at":
          comparison =
            new Date(a.updated_at || a.created_at || 0) -
            new Date(b.updated_at || b.created_at || 0);
          break;
        default:
          comparison = 0;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

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
          </Box>

          <Box className="sort-controls">
            <TextField
              select
              value={sortBy}
              onChange={handleSortChange}
              size="small"
              SelectProps={{
                native: true,
              }}
            >
              <option value="updated_at">Last Updated</option>
              <option value="created_at">Date Created</option>
              <option value="name">Name</option>
            </TextField>
            <Button
              variant="outlined"
              size="small"
              onClick={handleSortOrderToggle}
              className="sort-order-button"
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </Button>
          </Box>

          <Button
            variant="contained"
            color="primary"
            onClick={handleCreateClick}
            startIcon={<AddIcon />}
          >
            Create Scene
          </Button>
        </Box>
      </Box>

      {filteredAndSortedScenes.length > 0 ? (
        <Grid container spacing={3} className="scene-grid">
          {filteredAndSortedScenes.map((scene) => (
            <Grid item xs={12} sm={6} md={4} key={scene.id}>
              <SceneCard
                scene={scene}
                onDelete={handleDeleteClick}
                onEdit={handleEditClick}
                isOwner={user?.id === scene.universe?.user_id}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box className="empty-state">
          <Typography variant="h6" gutterBottom>
            No scenes found
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            Create your first scene to get started!
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCreateClick}
            startIcon={<AddIcon />}
          >
            Create Scene
          </Button>
        </Box>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!sceneToDelete}
        onClose={handleDeleteCancel}
        disableEnforceFocus
        container={() => document.body}
        aria-labelledby="delete-scene-title"
        aria-describedby="delete-scene-description"
        BackdropProps={{
          "aria-hidden": null,
        }}
      >
        <DialogTitle id="delete-scene-title">Delete Scene</DialogTitle>
        <DialogContent id="delete-scene-description">
          <Typography>
            Are you sure you want to delete "{sceneToDelete?.name}"? This action
            cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Scene Creation Modal */}
      {isCreateModalOpen && (
        <SceneFormModal
          open={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleCreateSuccess}
          universeId={universeId}
        />
      )}
    </Container>
  );
};

export default SceneList;
