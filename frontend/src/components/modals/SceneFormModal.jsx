import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useDispatch } from "react-redux";
import apiClient from "../../services/api";
// Import only the fetchScenes thunk to refresh scenes after operations
import { fetchScenes } from "../../store/thunks/consolidated/scenesThunks";
import SceneForm from "../consolidated/SceneForm";

/**
 * Modal component for creating and editing scenes
 */
const SceneFormModal = ({
  isOpen,
  onClose,
  universeId,
  sceneId = null,
  modalType = "create",
  onSuccess = null,
}) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sceneData, setSceneData] = useState(null);
  // Use a ref to access the form submit function
  const formSubmitRef = React.useRef(null);

  // Fetch scene data if editing
  useEffect(() => {
    if (isOpen && modalType === "edit" && sceneId) {
      const fetchSceneData = async () => {
        try {
          setLoading(true);
          setError(null);

          const response = await apiClient.getScene(sceneId);
          const data = response?.data?.scene || response?.data;

          if (data) {
            setSceneData(data);
          } else {
            throw new Error("Scene data not found");
          }
        } catch (err) {
          console.error("Error fetching scene:", err);
          setError("Failed to load scene data. Please try again.");
        } finally {
          setLoading(false);
        }
      };

      fetchSceneData();
    }
  }, [isOpen, modalType, sceneId]);

  const handleCancel = () => {
    onClose();
  };

  const handleSubmit = async (formValues) => {
    try {
      setLoading(true);
      setError(null);

      let result;
      if (modalType === "create") {
        // Add universe_id to form values
        const scenePayload = {
          ...formValues,
          universe_id: universeId,
          is_deleted: false,
        };

        console.log(
          "SceneFormModal - Creating scene with payload:",
          scenePayload
        );
        const response = await apiClient.createScene(scenePayload);
        console.log("SceneFormModal - Create scene response:", response);

        result = response?.data?.scene || response?.data;

        if (result) {
          result.is_deleted = false;
          console.log(
            "SceneFormModal - Ensured is_deleted is false in result:",
            result
          );
          // Refresh scenes list via Redux thunk
          console.log(
            "SceneFormModal - Dispatching fetchScenes to refresh the list"
          );
          await dispatch(fetchScenes(universeId));
          console.log("SceneFormModal - Scenes refreshed from API");
        } else {
          throw new Error("Failed to create scene");
        }
      } else if (modalType === "edit") {
        // Make sure we have the scene ID
        const scenePayload = {
          ...formValues,
          universe_id: universeId,
        };

        const response = await apiClient.updateScene(sceneId, scenePayload);
        result = response?.data?.scene || response?.data;

        if (result) {
          // Refresh scenes list via Redux thunk
          dispatch(fetchScenes(universeId));
        } else {
          throw new Error("Failed to update scene");
        }
      }

      // Call success callback if provided
      if (onSuccess) {
        console.log(
          "SceneFormModal - Calling onSuccess with:",
          modalType,
          result
        );
        onSuccess(modalType, result);
      }

      // Close the modal
      onClose();
    } catch (err) {
      console.error("Error saving scene:", err);
      setError("Failed to save scene. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Method to register the form submit function
  const registerSubmit = (submitFn) => {
    formSubmitRef.current = submitFn;
  };

  const getTitle = () => {
    return modalType === "create" ? "Create New Scene" : "Edit Scene";
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleCancel}
      maxWidth="md"
      fullWidth
      scroll="paper"
    >
      <DialogTitle>{getTitle()}</DialogTitle>
      <DialogContent dividers>
        {loading && !sceneData && modalType === "edit" ? (
          <Box display="flex" justifyContent="center" my={3}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : (
          <Box sx={{ mt: 2 }}>
            {/* Use SceneForm directly */}
            <SceneForm
              universeId={universeId}
              sceneId={modalType === "edit" ? sceneId : null}
              initialData={sceneData}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              registerSubmit={registerSubmit}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel} color="primary">
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={() => formSubmitRef.current && formSubmitRef.current()}
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} color="inherit" />}
        >
          {modalType === "create" ? "Create" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

SceneFormModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  universeId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    .isRequired,
  sceneId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  modalType: PropTypes.oneOf(["create", "edit"]),
  onSuccess: PropTypes.func,
};

export default SceneFormModal;
