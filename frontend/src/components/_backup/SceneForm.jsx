import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  createScene,
  updateScene,
} from "../../store/thunks/consolidated/scenesThunks";

const SceneForm = ({ open, onClose, onSuccess, scene, universeId }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_active: true,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (scene) {
      setFormData({
        name: scene.name,
        description: scene.description || "",
        is_active: scene.is_active,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        is_active: true,
      });
    }
  }, [scene]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    if (formData.name.length > 100) {
      newErrors.name = "Name cannot exceed 100 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const sceneData = {
        ...formData,
        universe_id: universeId,
      };

      if (scene) {
        await updateScene({ id: scene.id, ...sceneData });
      } else {
        await createScene(sceneData);
      }

      onSuccess();
      onClose();
    } catch (error) {
      setSubmitError(
        error.message || "An error occurred while saving the scene"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{scene ? "Edit Scene" : "Create New Scene"}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {submitError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {submitError}
            </Alert>
          )}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Scene Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={!!errors.name}
              helperText={errors.name}
              required
              fullWidth
            />
            <TextField
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              multiline
              rows={4}
              fullWidth
            />
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                style={{ marginRight: 8 }}
              />
              <label htmlFor="is_active">Active Scene</label>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <CircularProgress size={24} />
            ) : scene ? (
              "Update Scene"
            ) : (
              "Create Scene"
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

SceneForm.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  scene: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    description: PropTypes.string,
    is_active: PropTypes.bool,
  }),
  universeId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    .isRequired,
};

export default SceneForm;
