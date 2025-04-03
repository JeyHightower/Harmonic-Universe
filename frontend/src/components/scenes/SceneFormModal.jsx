import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Button from "../common/Button";
import Input from "../common/Input";
import Modal from "../common/Modal.jsx";
import {
  createScene,
  updateScene,
} from "../../store/thunks/consolidated/scenesThunks.js";
import "../../styles/SceneFormModal.css";

const SceneFormModal = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  universeId,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.scenes);
  const isEditing = !!initialData;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    universe_id: universeId || "",
    scene_type: "standard",
    is_active: true,
    duration: 60,
  });

  // Form validation
  const [errors, setErrors] = useState({});

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
    console.log("SceneFormModal - isOpen state changed:", isOpen);
    console.log("SceneFormModal - initialData:", initialData);
    console.log(
      "SceneFormModal - Modal should be:",
      isOpen ? "OPENING" : "CLOSING"
    );

    if (initialData) {
      console.log("SceneFormModal - Setting form data with initialData");
      setFormData({
        title: initialData.title || initialData.name || "",
        description: initialData.description || "",
        universe_id: initialData.universe_id || universeId,
        scene_type: initialData.scene_type || "standard",
        is_active: initialData.is_active !== false,
        duration: initialData.duration || 60,
      });
    } else if (universeId) {
      console.log(
        "SceneFormModal - Setting universe_id from prop:",
        universeId
      );
      setFormData((prev) => ({
        ...prev,
        universe_id: universeId,
      }));
    }
  }, [initialData, universeId, isOpen]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.length < 3) {
      newErrors.title = "Title must be at least 3 characters";
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = "Description must be less than 500 characters";
    }

    if (!formData.universe_id) {
      newErrors.universe_id = "Universe ID is required";
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

    // Clear field-specific error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Reset errors
    setErrors({});

    // Validate form
    const formErrors = {};
    if (!formData.title?.trim()) {
      formErrors.title = "Title is required";
    }

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    // Submit form
    setIsSubmitting(true);
    console.log("SceneFormModal - Submitting form...", formData);

    try {
      if (isEditing) {
        console.log("SceneFormModal - Updating scene", initialData.id);

        // Update scene using Redux action
        const resultAction = await dispatch(
          updateScene({
            id: initialData.id,
            data: formData,
          })
        );

        if (updateScene.fulfilled.match(resultAction)) {
          setShowSuccessMessage(true);

          // Extract scene from the standardized response format
          const sceneData = resultAction.payload.scene;

          // Use a shorter timeout for better responsiveness
          setTimeout(() => {
            if (onSuccess) {
              onSuccess("update", sceneData);
            }
            onClose();
          }, 300); // Reduced from 1500ms to 300ms
        } else if (updateScene.rejected.match(resultAction)) {
          const errorMessage =
            resultAction.payload?.message || "Failed to update scene";
          setErrors({ form: errorMessage });
        }
      } else {
        console.log("SceneFormModal - Creating new scene");

        // Log details about the request
        console.log("API base URL:", import.meta.env.VITE_API_BASE_URL);
        console.log("Using createScene method from scenes thunk");

        // Create scene using Redux action
        const resultAction = await dispatch(
          createScene({
            ...formData,
            universe_id: universeId,
          })
        );

        console.log("Scene creation result:", resultAction);

        if (createScene.fulfilled.match(resultAction)) {
          console.log("Scene created successfully:", resultAction.payload);
          setShowSuccessMessage(true);

          // Extract scene from the standardized response format
          const sceneData = resultAction.payload.scene;

          // Use a shorter timeout for better responsiveness
          setTimeout(() => {
            // Call onSuccess with the scene data
            if (onSuccess) {
              onSuccess("create", sceneData);
            } else {
              // If no onSuccess callback is provided, navigate directly to scenes page
              console.log(
                "No onSuccess callback provided, navigating to scenes page"
              );
              navigate(`/universes/${universeId}/scenes`);
            }
            onClose();
          }, 300); // Reduced from 1500ms to 300ms
        } else if (createScene.rejected.match(resultAction)) {
          console.error("Scene creation failed:", resultAction.payload);
          const errorMessage =
            resultAction.payload?.message || "Failed to create scene";
          setErrors({ form: errorMessage });
        }
      }
    } catch (error) {
      console.error("SceneFormModal - Failed to save scene:", error);
      setErrors({
        form: error.message || "An unexpected error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Scene" : "Create Scene"}
      data-testid="scene-form-modal"
    >
      {console.log("SceneFormModal - Rendering modal with isOpen:", isOpen)}
      <form onSubmit={handleSubmit} className="scene-form">
        <Input
          label="Scene Title"
          name="title"
          type="text"
          value={formData.title}
          onChange={handleChange}
          error={errors.title}
          required
        />

        <Input
          label="Description"
          name="description"
          type="textarea"
          value={formData.description}
          onChange={handleChange}
          error={errors.description}
          rows={4}
        />

        <div className="form-row">
          <div className="select-field">
            <label htmlFor="scene_type">Scene Type</label>
            <select
              id="scene_type"
              name="scene_type"
              value={formData.scene_type}
              onChange={handleChange}
            >
              {sceneTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Duration (seconds)"
            name="duration"
            type="number"
            value={formData.duration}
            onChange={handleChange}
            min={1}
            max={3600}
          />
        </div>

        <div className="checkbox-field">
          <input
            id="is_active"
            name="is_active"
            type="checkbox"
            checked={formData.is_active}
            onChange={handleChange}
          />
          <label htmlFor="is_active">Active scene</label>
        </div>

        {/* Hidden field for universe_id */}
        <input type="hidden" name="universe_id" value={formData.universe_id} />

        {error && <div className="form-error">{error}</div>}
        {errors.form && <div className="form-error">{errors.form}</div>}

        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEditing ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

SceneFormModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  initialData: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string,
    description: PropTypes.string,
    universe_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    scene_type: PropTypes.string,
    is_active: PropTypes.bool,
    duration: PropTypes.number,
  }),
  universeId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default SceneFormModal;
