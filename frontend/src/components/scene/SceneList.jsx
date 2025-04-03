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
  const { scenes, loading, error } = useSelector((state) => state.scenes);
  const { user } = useSelector((state) => state.auth);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [sceneToDelete, setSceneToDelete] = useState(null);
  const [sceneToEdit, setSceneToEdit] = useState(null);
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("updated_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [forceRender, setForceRender] = useState(0);

  // Add local cache of created scenes to ensure they appear even if API fetch fails
  const [localScenes, setLocalScenes] = useState([]);
  const createdScenesRef = useRef(new Map());

  // Combine API scenes with locally created scenes
  const allScenes = React.useMemo(() => {
    const scenesMap = new Map();

    // First add all scenes from the API
    scenes.forEach((scene) => {
      scenesMap.set(scene.id, scene);
    });

    // Then add any locally created scenes that aren't in the API results
    Array.from(createdScenesRef.current.values()).forEach((scene) => {
      if (!scenesMap.has(scene.id)) {
        scenesMap.set(scene.id, scene);
      }
    });

    return Array.from(scenesMap.values());
  }, [scenes, localScenes]); // Add localScenes as dependency for re-computation

  useEffect(() => {
    if (universeId) {
      console.log("SceneList: Fetching scenes for universe:", universeId);
      dispatch(fetchScenes(universeId))
        .then((result) => {
          console.log("SceneList: Scenes fetch completed:", result);
          console.log("SceneList: Current scenes in store:", scenes);

          // Check if we got any scenes back from the API
          if (scenes.length === 0 && createdScenesRef.current.size > 0) {
            console.log(
              "SceneList: No scenes returned from API, but we have locally created scenes:",
              Array.from(createdScenesRef.current.values())
            );
            // Force update to ensure local scenes are displayed
            setLocalScenes(Array.from(createdScenesRef.current.values()));
          }
        })
        .catch((err) => {
          console.error("SceneList: Error fetching scenes:", err);
        });
    }
  }, [dispatch, universeId, forceRender]);

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

    // Store the created scene locally to ensure it appears in the UI
    // even if API fetch fails to return it
    if (sceneData && sceneData.id) {
      console.log(
        "SceneList: Storing created scene in local reference:",
        sceneData
      );
      createdScenesRef.current.set(sceneData.id, sceneData);
      setLocalScenes(Array.from(createdScenesRef.current.values()));
    }

    // Force render first to ensure UI update
    setForceRender((prev) => prev + 1);

    // Refresh the scenes list with the new data
    dispatch(fetchScenes(universeId))
      .then((result) => {
        console.log("SceneList: Scenes refreshed after creation");
        console.log("SceneList: Current path:", window.location.pathname);

        // Make sure we're on the scenes list page
        const targetPath = `/universes/${universeId}/scenes`;
        if (window.location.pathname !== targetPath) {
          console.log(
            `SceneList: Navigating to scenes list page: ${targetPath}`
          );
          navigate(targetPath, { replace: true });
        } else {
          console.log(
            "SceneList: Already on scenes list page, forcing re-render"
          );
          // Force another render to ensure UI updates with new data
          setForceRender((prev) => prev + 1);
        }
      })
      .catch((err) => {
        console.error("SceneList: Error refreshing scenes:", err);
      });
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

  // Filter and sort scenes
  const filteredAndSortedScenes = [...allScenes]
    .filter((scene) => {
      if (filter === "all") return true;
      if (filter === "active") return scene.is_active;
      if (filter === "inactive") return !scene.is_active;
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "created_at":
          comparison = new Date(a.created_at) - new Date(b.created_at);
          break;
        case "updated_at":
          comparison =
            new Date(a.updated_at || a.created_at) -
            new Date(b.updated_at || b.created_at);
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
