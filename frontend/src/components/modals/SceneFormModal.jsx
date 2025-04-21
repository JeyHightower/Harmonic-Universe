import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
} from "@mui/material";
import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import apiClient from "../../services/api";
// Import only the fetchScenes thunk to refresh scenes after operations
import CloseIcon from "@mui/icons-material/Close";
import SceneForm from "../../features/scene/pages/SceneForm";
import { fetchSceneById, fetchScenes } from "../../store/thunks/consolidated/scenesThunks";

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
  const [initialValues, setInitialValues] = useState(null);

  // Fetch scene data if editing or clear data when creating
  useEffect(() => {
    if (isOpen) {
      setError(null);
      console.log(`SceneFormModal: Modal opened in ${modalType} mode`);
      fetchSceneData();
    }
  }, [isOpen, modalType, sceneId, universeId]);

  // Add debugging for the form submit reference
  useEffect(() => {
    console.log(
      "SceneFormModal - formSubmitRef current value:",
      formSubmitRef.current
    );
  }, [formSubmitRef.current]);

  const handleCancel = () => {
    onClose();
  };

  const handleSubmit = async (action, formData) => {
    try {
      setLoading(true);
      setError(null);

      // Check if we received properly formatted data from SceneForm
      console.log("SceneFormModal - Received form data:", action, formData);

      if (!formData || typeof formData !== "object") {
        throw new Error("Invalid form data received from SceneForm");
      }

      let result;
      if (action === "create" || modalType === "create") {
        // Make sure we have a proper payload with required fields
        if (!formData.name || formData.name.trim() === '') {
          console.error("SceneFormModal - Missing name in form data");
          throw new Error("Scene name is required");
        }

        console.log("SceneFormModal - Name field value:", formData.name);

        // Ensure universe_id is set
        const scenePayload = {
          ...formData,
          universe_id: typeof universeId === 'string' ? parseInt(universeId, 10) : universeId,
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
      } else if (action === "update" || modalType === "edit") {
        // Make sure we have the scene ID
        if (!sceneId && !formData.id) {
          throw new Error("Scene ID is required for update");
        }

        const idToUse = sceneId || formData.id;
        const scenePayload = {
          ...formData,
          universe_id: typeof universeId === 'string' ? parseInt(universeId, 10) : universeId,
          is_deleted: false,
        };

        console.log(
          `SceneFormModal - Updating scene ${idToUse} with payload:`,
          scenePayload
        );
        const response = await apiClient.updateScene(idToUse, scenePayload);
        console.log("SceneFormModal - Update scene response:", response);

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
      setError(err.message || "Failed to save scene. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Method to register the form submit function
  const registerSubmit = (submitFn) => {
    console.log("SceneFormModal - Registering submit function");
    formSubmitRef.current = submitFn;
  };

  const handleModalSubmit = () => {
    console.log(
      "SceneFormModal - Submit button clicked, form ref:",
      formSubmitRef.current
    );
    if (formSubmitRef.current && typeof formSubmitRef.current === "function") {
      formSubmitRef.current();
    } else {
      console.error("SceneFormModal - No valid submit function registered");
      setError("Form submission failed. Please try again.");
    }
  };

  const getTitle = () => {
    return modalType === "create" ? "Create New Scene" : "Edit Scene";
  };

  const fetchSceneData = async () => {
    if (modalType === "edit" && sceneId) {
      setLoading(true);
      setError(null);
      try {
        console.log("SceneFormModal: Fetching scene data for ID:", sceneId);
        const sceneData = await dispatch(fetchSceneById(sceneId)).unwrap();
        console.log("SceneFormModal: Fetched scene data:", sceneData);

        if (!sceneData) {
          throw new Error("No scene data returned");
        }

        // Ensure we have the correct ID format
        const normalizedSceneId = String(sceneData.id || sceneId).trim();

        setInitialValues({
          name: sceneData.name || "",
          description: sceneData.description || "",
          universe_id: typeof universeId === 'string' ? parseInt(universeId, 10) : universeId || null,
          id: normalizedSceneId,
        });
      } catch (error) {
        console.error("SceneModal - Error loading scene data:", error);
        if (error.response?.status === 404) {
          setError(`Scene with ID ${sceneId} not found. It may have been deleted or doesn't exist.`);
        } else {
          setError(`Failed to load scene: ${error.message || "Unknown error"}`);
        }

        // Set empty initial values to prevent form breaking
        setInitialValues({
          name: "",
          description: "",
          universe_id: typeof universeId === 'string' ? parseInt(universeId, 10) : universeId || null,
        });
      } finally {
        setLoading(false);
      }
    } else if (modalType === "create") {
      // For create mode, set default initial values
      console.log(
        "SceneFormModal: Setting default initial values for create mode"
      );
      setInitialValues({
        name: "",
        description: "",
        universe_id: typeof universeId === 'string' ? parseInt(universeId, 10) : universeId || null,
      });
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleCancel}
      maxWidth="md"
      fullWidth
      PaperProps={{
        elevation: 5,
        sx: {
          borderRadius: 2,
          p: 2,
        },
      }}
    >
      <DialogTitle sx={{ mb: 2 }}>
        {getTitle()}
        <IconButton
          aria-label="close"
          onClick={handleCancel}
          sx={{
            position: "absolute",
            right: 10,
            top: 10,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <DialogContent>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <SceneForm
            initialValues={initialValues}
            universeId={universeId}
            sceneId={sceneId}
            readOnly={false}
            isEditMode={modalType === "edit"}
            onSubmit={handleSubmit}
            registerSubmit={registerSubmit}
            onCancel={handleCancel}
          />
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleCancel}>Cancel</Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleModalSubmit}
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} color="inherit" />}
        >
          {modalType === "create" ? "Create" : "Save Changes"}
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
