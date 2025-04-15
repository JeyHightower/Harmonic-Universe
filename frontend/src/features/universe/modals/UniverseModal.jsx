import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Button from "../../../components/common/Button";
import Input from "../../../components/common/Input";
import { ModalSystem } from "../../../components/modals/index.mjs";
import { MODAL_CONFIG } from "../../../utils/config";
import {
  createUniverse,
  updateUniverse,
} from "../../../store/thunks/universeThunks";
import "../styles/UniverseFormModal.css";

/**
 * Universe Modal component for creating, editing, or viewing a universe
 * 
 * Consolidated version that supports multiple modes and replaces both
 * the original UniverseModal and UniverseModalComponent
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {boolean} props.open - Alternative prop for isOpen for compatibility
 * @param {Function} props.onClose - Function to call when the modal is closed
 * @param {Function} props.onSuccess - Function to call when the operation is successful
 * @param {Object} props.universe - Universe data for editing or viewing
 * @param {string} props.mode - Modal mode: 'create', 'edit', or 'view' (overrides isEdit)
 * @param {boolean} props.isEdit - Whether the modal is in edit mode (legacy)
 */
const UniverseModal = ({
  isOpen,
  open,
  onClose,
  onSuccess,
  universe = null,
  mode,
  isEdit = false,
}) => {
  const dispatch = useDispatch();
  const { loading, error: storeError } = useSelector(
    (state) => state.universes
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine the actual mode from props
  const actualMode = mode || (isEdit ? "edit" : "create");
  const isViewMode = actualMode === "view";
  const isEditMode = actualMode === "edit";
  const isCreateMode = actualMode === "create";
  
  // Backwards compatibility for open/isOpen props
  const isModalOpen = open || isOpen || false;

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    genre: "",
    theme: "",
    is_public: false,
  });

  // Form validation
  const [errors, setErrors] = useState({});

  // Initialize form with data if editing or viewing
  useEffect(() => {
    console.log("UniverseModal - Initializing with universe:", universe);
    if (universe && (isEditMode || isViewMode)) {
      setFormData({
        name: universe.name || "",
        description: universe.description || "",
        genre: universe.genre || "",
        theme: universe.theme || "",
        is_public: universe.is_public || false,
      });
    } else if (isCreateMode) {
      // Reset form when creating new
      setFormData({
        name: "",
        description: "",
        genre: "",
        theme: "",
        is_public: false,
      });
    }
  }, [universe, isEditMode, isViewMode, isCreateMode]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.length < 3) {
      newErrors.name = "Name must be at least 3 characters";
    }

    if (formData.name.length > 100) {
      newErrors.name = "Name must be less than 100 characters";
    }

    if (formData.description && formData.description.length > 1000) {
      newErrors.description = "Description must be less than 1000 characters";
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    // Don't submit in view mode
    if (isViewMode) {
      onClose();
      return;
    }
    
    setIsSubmitting(true);
    setErrors({});

    // Validate form inputs
    const isValid = validateForm();
    if (!isValid) {
      setIsSubmitting(false);
      return;
    }

    try {
      // Prepare the universe data for API submission
      const universeData = {
        name: formData.name.trim(),
        description: formData.description.trim() || "",
        genre: formData.genre?.trim() || "",
        theme: formData.theme?.trim() || "",
        is_public: formData.is_public,
      };

      // Call the appropriate API function based on mode
      const result = isEditMode
        ? await dispatch(
            updateUniverse({ id: universe.id, ...universeData })
          ).unwrap()
        : await dispatch(createUniverse(universeData)).unwrap();

      console.log(
        `UniverseModal - ${isEditMode ? "Update" : "Create"} result:`,
        result
      );

      // Close the modal
      if (onClose) {
        onClose();
      }

      // Call the success callback with the result
      if (onSuccess) {
        // Extract the universe data from the response
        let universeData = null;

        if (result && typeof result === "object") {
          // Handle different response formats
          if (result.universe && typeof result.universe === "object") {
            universeData = result.universe;
          } else if (result.data && result.data.universe) {
            universeData = result.data.universe;
          } else if (result.id) {
            universeData = result;
          } else if (
            result.universes &&
            Array.isArray(result.universes) &&
            result.universes.length > 0
          ) {
            universeData = result.universes[0];
          } else {
            universeData = result;
          }
        } else {
          universeData = result;
        }

        console.log(
          "UniverseModal - Calling onSuccess with data:",
          universeData
        );
        // For compatibility with both callback styles
        if (isEditMode) {
          onSuccess(universeData, 'edit');
        } else {
          onSuccess(universeData, 'create');
        }
      }
    } catch (err) {
      console.error("UniverseModal - Failed to save universe:", err);
      // Set form-wide error message
      setErrors((prev) => ({
        ...prev,
        form: err.message || "Failed to save universe. Please try again.",
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get modal title based on mode
  const getModalTitle = () => {
    switch (actualMode) {
      case "create":
        return "Create New Universe";
      case "edit":
        return "Edit Universe";
      case "view":
        return "Universe Details";
      default:
        return "Universe";
    }
  };

  return (
    <ModalSystem
      isOpen={isModalOpen}
      onClose={onClose}
      title={getModalTitle()}
      className="universe-form-modal"
      size={MODAL_CONFIG.SIZES.SMALL}
    >
      <form
        onSubmit={handleSubmit}
        className="universe-form universe-form-compact"
      >
        <Input
          label="Universe Name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          required
          className="compact-input"
          disabled={isViewMode || isSubmitting}
        />

        <Input
          label="Description"
          name="description"
          type="textarea"
          value={formData.description}
          onChange={handleChange}
          error={errors.description}
          rows={3}
          disabled={isViewMode || isSubmitting}
        />

        <Input
          label="Genre"
          name="genre"
          type="text"
          value={formData.genre}
          onChange={handleChange}
          error={errors.genre}
          disabled={isViewMode || isSubmitting}
        />

        <Input
          label="Theme"
          name="theme"
          type="text"
          value={formData.theme}
          onChange={handleChange}
          error={errors.theme}
          disabled={isViewMode || isSubmitting}
        />

        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              name="is_public"
              checked={formData.is_public}
              onChange={handleChange}
              disabled={isViewMode || isSubmitting}
            />
            Make Universe Public
          </label>
          <small>Public universes can be viewed by other users</small>
        </div>

        {errors.form && <div className="error-message">{errors.form}</div>}

        <div className="form-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          {!isViewMode && (
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              {isSubmitting
                ? "Saving..."
                : isEditMode
                ? "Save Changes"
                : "Create Universe"}
            </Button>
          )}
        </div>
      </form>
    </ModalSystem>
  );
};

UniverseModal.propTypes = {
  isOpen: PropTypes.bool,
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  universe: PropTypes.object,
  mode: PropTypes.oneOf(["create", "edit", "view"]),
  isEdit: PropTypes.bool,
};

export default UniverseModal; 