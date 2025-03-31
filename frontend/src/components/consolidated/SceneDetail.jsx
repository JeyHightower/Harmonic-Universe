import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Grid,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import {
  fetchSceneById,
  deleteScene,
} from "../../store/thunks/consolidated/scenesThunks";
import { formatDate } from "../../utils/dateUtils";
import "../../styles/SceneDetail.css";
import SceneForm from "./SceneForm";

const SceneDetail = ({ isEdit = false }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { sceneId, universeId } = useParams();

  // Memoize selectors to prevent unnecessary rerenders
  const sceneState = useSelector((state) => state.scenes || {});

  // Use useMemo to memoize derived state from the selector
  const {
    currentScene: scene,
    loading,
    error,
  } = useMemo(
    () => ({
      currentScene: sceneState.currentScene || null,
      loading: sceneState.loading || false,
      error: sceneState.error || null,
    }),
    [sceneState]
  );

  // Memoize auth state selector
  const authState = useSelector((state) => state.auth || {});
  const { user } = useMemo(
    () => ({
      user: authState.user || null,
      isAuthenticated: authState.isAuthenticated || false,
    }),
    [authState]
  );

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  // If isEdit is true, automatically show the edit form
  useEffect(() => {
    if (isEdit && scene) {
      console.log("Opening edit form automatically from route prop");
      setShowEditForm(true);
    }
  }, [isEdit, scene]);

  useEffect(() => {
    if (sceneId) {
      try {
        console.log("Fetching scene with ID:", sceneId);
        dispatch(fetchSceneById(sceneId)).catch((error) => {
          console.error("Error fetching scene:", error);
          if (error.response?.status === 401) {
            // Token issue - this will be handled by the API interceptor
            console.warn(
              "Authentication issue detected, might redirect to login"
            );
          }
        });
      } catch (error) {
        console.error("Error in scene fetch effect:", error);
      }
    }
  }, [dispatch, sceneId]);

  const handleEdit = () => {
    try {
      console.log(
        "SceneDetail: Navigating to edit page for scene ID:",
        sceneId
      );

      // Make sure we have the universeId
      const targetUniverseId = universeId || scene?.universe_id;

      if (targetUniverseId) {
        // Use the correct route format with universeId included
        navigate(`/universes/${targetUniverseId}/scenes/${sceneId}/edit`);
      } else {
        console.warn("Missing universeId, cannot navigate to edit scene page");
        // Fallback - try to navigate using just the sceneId
        navigate(`/scenes/${sceneId}/edit`);
      }
    } catch (error) {
      console.error("Error navigating to edit page:", error);
    }
  };

  const handleDelete = async () => {
    try {
      console.log("Deleting scene with ID:", sceneId);
      await dispatch(deleteScene(sceneId));

      // Determine where to navigate after deletion
      const targetUniverseId = universeId || scene?.universe_id;

      if (targetUniverseId) {
        navigate(`/universes/${targetUniverseId}`);
      } else {
        // Fallback to dashboard if we don't have a universe_id
        console.warn("No universe_id found for scene, navigating to dashboard");
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Error deleting scene:", error);
    } finally {
      setShowDeleteDialog(false);
    }
  };

  const handleBack = () => {
    try {
      // Determine where to navigate back to
      const targetUniverseId = universeId || scene?.universe_id;

      if (targetUniverseId) {
        navigate(`/universes/${targetUniverseId}`);
      } else {
        // Fallback to universes list if we don't have a universe_id
        console.warn("No universe_id found for scene, navigating to dashboard");
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Error navigating back:", error);
      // Ultimate fallback
      navigate("/dashboard");
    }
  };

  if (loading) {
    return (
      <Container className="scene-detail-container">
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
      <Container className="scene-detail-container">
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  if (!scene) {
    return (
      <Container className="scene-detail-container">
        <Alert severity="warning" sx={{ mt: 2 }}>
          Scene not found
        </Alert>
      </Container>
    );
  }

  const isOwner = user?.id === scene.universe?.user_id;

  return (
    <Container className="scene-detail-container">
      <Box className="scene-detail-header">
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mb: 2 }}
        >
          Back to Scenes
        </Button>
        <Box className="scene-detail-title-section">
          <Typography variant="h4" component="h1" gutterBottom>
            {scene.name}
          </Typography>
          {isOwner && (
            <Box className="scene-detail-actions">
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={handleEdit}
              >
                Edit Scene
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setShowDeleteDialog(true)}
              >
                Delete Scene
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper className="scene-detail-section">
            <Typography variant="h6" gutterBottom>
              Description
            </Typography>
            <Typography variant="body1" paragraph>
              {scene.description || "No description provided"}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper className="scene-detail-section">
            <Typography variant="h6" gutterBottom>
              Scene Details
            </Typography>
            <Box className="scene-detail-info">
              <Typography variant="body2" color="textSecondary">
                Created: {formatDate(scene.created_at)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Last Updated: {formatDate(scene.updated_at)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Status: {scene.is_active ? "Active" : "Inactive"}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
      >
        <DialogTitle>Delete Scene</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{scene.name}"? This action cannot
            be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {showEditForm && scene && (
        <Dialog
          open={showEditForm}
          onClose={() => setShowEditForm(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Edit Scene</DialogTitle>
          <DialogContent>
            <SceneForm
              open={showEditForm}
              onClose={() => {
                setShowEditForm(false);
                // If we came from the edit route, navigate back to detail
                if (isEdit) {
                  navigate(`/universes/${scene.universe_id}/scenes/${sceneId}`);
                }
              }}
              onSuccess={() => {
                setShowEditForm(false);
                // Refresh scene data
                dispatch(fetchSceneById(sceneId));
                // If we came from the edit route, navigate back to detail
                if (isEdit) {
                  navigate(`/universes/${scene.universe_id}/scenes/${sceneId}`);
                }
              }}
              scene={scene}
              universeId={scene.universe_id}
            />
          </DialogContent>
        </Dialog>
      )}
    </Container>
  );
};

export default SceneDetail;
