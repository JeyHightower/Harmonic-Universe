import React, { useEffect, useState } from "react";
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
  deleteSceneById,
} from "../../store/thunks/sceneThunks";
import { formatDate } from "../../utils/dateUtils";
import "../../styles/SceneDetail.css";

const SceneDetail = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { sceneId } = useParams();
  const {
    currentScene: scene,
    loading,
    error,
  } = useSelector((state) => state.scene);
  const { user } = useSelector((state) => state.auth);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (sceneId) {
      dispatch(fetchSceneById(sceneId));
    }
  }, [dispatch, sceneId]);

  const handleEdit = () => {
    navigate(`/scenes/${sceneId}/edit`);
  };

  const handleDelete = async () => {
    try {
      await dispatch(deleteSceneById(sceneId));
      navigate(`/universes/${scene?.universe_id}/scenes`);
    } catch (error) {
      console.error("Error deleting scene:", error);
    } finally {
      setShowDeleteDialog(false);
    }
  };

  const handleBack = () => {
    navigate(`/universes/${scene?.universe_id}/scenes`);
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
    </Container>
  );
};

export default SceneDetail;
