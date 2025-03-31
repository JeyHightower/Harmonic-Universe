import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
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
import { fetchScenes, deleteScene } from "../../store/thunks/sceneThunks";
import SceneCard from "./SceneCard";
import "../../styles/SceneList.css";

const SceneList = () => {
  const dispatch = useDispatch();
  const { universeId } = useParams();
  const { scenes, loading, error } = useSelector((state) => state.scene);
  const { user } = useSelector((state) => state.auth);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [sceneToDelete, setSceneToDelete] = useState(null);
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("updated_at");
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    if (universeId) {
      dispatch(fetchScenes(universeId));
    }
  }, [dispatch, universeId]);

  const handleCreateClick = () => {
    setIsCreateModalOpen(true);
  };

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    dispatch(fetchScenes(universeId));
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

  // Filter and sort scenes
  const filteredAndSortedScenes = [...scenes]
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
          {error}
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
      <Dialog open={!!sceneToDelete} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Scene</DialogTitle>
        <DialogContent>
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
    </Container>
  );
};

export default SceneList;
