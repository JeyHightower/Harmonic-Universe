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
  Chip,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  CalendarToday as CalendarIcon,
  Update as UpdateIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import {
  fetchSceneById,
  deleteScene,
} from "../../store/thunks/consolidated/scenesThunks";
import { formatDate } from "../../utils/dateUtils";
import "../../styles/SceneDetail.css";
import SceneForm from "./SceneForm";
import apiClient from "../../services/api";

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
        navigate(`/universes/${targetUniverseId}/scenes`);
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
        navigate(`/universes/${targetUniverseId}/scenes`);
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

  const handleCloseEditForm = () => {
    setShowEditForm(false);
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
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mb: 2 }}
        >
          Back to Scenes
        </Button>
        <Box className="scene-detail-title-section">
          <Typography variant="h4" component="h1">
            {scene.name}
          </Typography>
          {isOwner && (
            <Box className="scene-detail-actions">
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={handleEdit}
                color="primary"
              >
                Edit Scene
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setShowDeleteDialog(true)}
              >
                Delete
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
              <Typography variant="body2" className="date-info-item">
                <span>
                  <CalendarIcon
                    fontSize="small"
                    sx={{ verticalAlign: "middle", mr: 1 }}
                  />{" "}
                  Created:
                </span>
                <span>{formatDate(scene.created_at)}</span>
              </Typography>
              <Typography variant="body2" className="date-info-item">
                <span>
                  <UpdateIcon
                    fontSize="small"
                    sx={{ verticalAlign: "middle", mr: 1 }}
                  />{" "}
                  Updated:
                </span>
                <span>{formatDate(scene.updated_at)}</span>
              </Typography>
              <Typography variant="body2" className="date-info-item">
                <span>
                  <InfoIcon
                    fontSize="small"
                    sx={{ verticalAlign: "middle", mr: 1 }}
                  />{" "}
                  Status:
                </span>
                <Chip
                  label={scene.is_active ? "Active" : "Inactive"}
                  size="small"
                  className={
                    scene.is_active ? "status-active" : "status-inactive"
                  }
                />
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        aria-labelledby="delete-dialog-title"
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle id="delete-dialog-title">Delete Scene</DialogTitle>
        <DialogContent dividers>
          <Typography>
            Are you sure you want to delete "{scene.name}"? This action cannot
            be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Form Dialog with proper configuration to ensure datepickers close correctly */}
      {showEditForm && scene && (
        <Dialog
          open={showEditForm}
          onClose={handleCloseEditForm}
          maxWidth="md"
          fullWidth
          disableEnforceFocus
          disableRestoreFocus
          closeAfterTransition
          aria-labelledby="edit-dialog-title"
        >
          <DialogTitle id="edit-dialog-title">Edit Scene</DialogTitle>
          <DialogContent dividers>
            <SceneForm
              universeId={scene.universe_id}
              sceneId={sceneId}
              initialData={scene}
              onSubmit={async (formattedValues) => {
                try {
                  console.log(
                    "SceneDetail - Form submitted with data:",
                    formattedValues
                  );

                  // Make sure universeId is included
                  if (!formattedValues.universe_id) {
                    console.log(
                      "SceneDetail - Adding missing universe_id:",
                      scene.universe_id
                    );
                    formattedValues.universe_id = scene.universe_id;
                  }

                  // Make the update API call
                  console.log(
                    "SceneDetail - Calling updateScene API with:",
                    sceneId,
                    formattedValues
                  );
                  const response = await apiClient.updateScene(
                    sceneId,
                    formattedValues
                  );
                  console.log("SceneDetail - Update response:", response);

                  // Process the response to get the result
                  let result;
                  if (response.data?.scene) {
                    result = response.data.scene;
                  } else if (response.data) {
                    result = response.data;
                  } else {
                    console.warn(
                      "SceneDetail - Unexpected API response format:",
                      response
                    );
                    result = response;
                  }

                  // Success! Close the form and refresh the data
                  handleCloseEditForm();

                  // Refresh scene data
                  dispatch(fetchSceneById(sceneId));

                  // If we came from the edit route, navigate back to detail
                  if (isEdit) {
                    navigate(
                      `/universes/${scene.universe_id}/scenes/${sceneId}`
                    );
                  }

                  return result; // Return the result to the SceneForm
                } catch (error) {
                  console.error("SceneDetail - Error updating scene:", error);
                  console.error(
                    "SceneDetail - Error details:",
                    error.response?.data || error.message
                  );
                  throw error; // Re-throw to let SceneForm handle the error
                }
              }}
              onCancel={() => {
                handleCloseEditForm();
                // If we came from the edit route, navigate back to detail
                if (isEdit) {
                  navigate(`/universes/${scene.universe_id}/scenes/${sceneId}`);
                }
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </Container>
  );
};

export default SceneDetail;
