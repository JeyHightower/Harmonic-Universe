import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  createScene,
  updateScene,
} from "../../store/thunks/consolidated/scenesThunks";

const SceneFormModal = ({
  open,
  onClose,
  onSuccess,
  initialData,
  universeId,
}) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.scenes);
  const isEditing = !!initialData;

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    universe_id: universeId || "",
    scene_type: "standard",
    is_active: true,
    duration: 60,
  });

  // Form validation
  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Scene types
  const sceneTypes = [
    { value: "standard", label: "Standard" },
    { value: "cinematic", label: "Cinematic" },
    { value: "action", label: "Action" },
    { value: "dialogue", label: "Dialogue" },
    { value: "montage", label: "Montage" },
  ];

  // Initialize form with data if editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        description: initialData.description || "",
        universe_id: initialData.universe_id || universeId,
        scene_type: initialData.scene_type || "standard",
        is_active: initialData.is_active !== false,
        duration: initialData.duration || 60,
      });
    } else if (universeId) {
      setFormData((prev) => ({
        ...prev,
        universe_id: universeId,
      }));
    }
  }, [initialData, universeId, open]);

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = "Name is required";
    } else if (formData.name.length < 3) {
      errors.name = "Name must be at least 3 characters";
    }

    if (formData.description && formData.description.length > 500) {
      errors.description = "Description must be less than 500 characters";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: e.target.type === "checkbox" ? checked : value,
    }));

    // Clear validation error when field is updated
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Make sure universe_id is set
      const sceneData = {
        ...formData,
        universe_id: universeId,
      };

      console.log("Starting scene submission with data:", sceneData);

      let result;
      let actionType;
      if (isEditing) {
        actionType = "update";
        result = await dispatch(
          updateScene({
            id: initialData.id,
            data: sceneData,
          })
        );
        console.log("Scene updated result:", result);
      } else {
        actionType = "create";
        console.log("About to dispatch createScene with data:", sceneData);
        result = await dispatch(createScene(sceneData));
        console.log("Scene created result:", result);
      }

      // Check for specific error patterns in the result
      if (result.error) {
        console.error(`Scene ${actionType} failed:`, result.error);
        throw new Error(
          result.error.message || `Failed to ${actionType} scene`
        );
      }

      // Get the actual scene data from the result
      const sceneResult = result.payload?.scene || {};
      console.log(`Scene ${actionType}d successfully:`, sceneResult);

      setSubmitSuccess(true);

      // Call onSuccess after a short delay to allow the store to update
      setTimeout(() => {
        console.log(`Calling onSuccess after scene ${actionType}`, {
          sceneId: sceneResult.id,
          universeId,
        });
        onSuccess();
      }, 1500);
    } catch (error) {
      console.error("Error saving scene:", error);
      setValidationErrors({ form: error.message || "Failed to save scene" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      disableEnforceFocus
      container={() => document.body}
      aria-labelledby="scene-form-title"
      aria-describedby="scene-form-description"
      BackdropProps={{
        "aria-hidden": null,
      }}
    >
      <DialogTitle id="scene-form-title">
        {isEditing ? "Edit Scene" : "Create Scene"}
      </DialogTitle>
      <DialogContent id="scene-form-description">
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {submitSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Scene {isEditing ? "updated" : "created"} successfully!
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Scene Name"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={handleChange}
            error={!!validationErrors.name}
            helperText={validationErrors.name}
            required
            sx={{ mb: 2 }}
          />

          <TextField
            margin="dense"
            name="description"
            label="Description"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.description}
            onChange={handleChange}
            error={!!validationErrors.description}
            helperText={validationErrors.description}
            multiline
            rows={4}
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="scene-type-label">Scene Type</InputLabel>
            <Select
              labelId="scene-type-label"
              name="scene_type"
              value={formData.scene_type}
              onChange={handleChange}
              label="Scene Type"
            >
              {sceneTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            margin="dense"
            name="duration"
            label="Duration (seconds)"
            type="number"
            fullWidth
            variant="outlined"
            value={formData.duration}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={formData.is_active}
                onChange={handleChange}
                name="is_active"
              />
            }
            label="Active"
          />
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <CircularProgress size={24} />
          ) : isEditing ? (
            "Update"
          ) : (
            "Create"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

SceneFormModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  initialData: PropTypes.object,
  universeId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    .isRequired,
};

export default SceneFormModal;
