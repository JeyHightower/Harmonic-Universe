import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "../common";
import Input from "../common/Input";
import Modal from "../common/Modal";
import { MODAL_CONFIG } from "../../utils/config";
import {
  createUniverse,
  updateUniverse,
} from "../../store/thunks/universeThunks";
import "../../styles/UniverseFormModal.css";

/**
 * Consolidated Universe Modal component for creating or editing a universe
 * Replaces CreateUniverseModal, UniverseCreateModal, and UniverseFormModal
 */
const UniverseModalFinal = ({
  isOpen,
  onClose,
  onSuccess,
  universe = null, // Default value for universe
  isEdit = false, // Default value for isEdit
}) => {
  const dispatch = useDispatch();
  const { loading, error: storeError } = useSelector(
    (state) => state.universes
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_public: false,
  });

  // Form validation
  const [errors, setErrors] = useState({});

  // Initialize form with data if editing
  useEffect(() => {
    console.log("UniverseModalFinal - Initializing with universe:", universe);
    if (universe && isEdit) {
      setFormData({
        name: universe.name || "",
        description: universe.description || "",
        is_public: universe.is_public || false,
      });
    } else {
      // Reset form when creating new
      setFormData({
        name: "",
        description: "",
        is_public: false,
      });
    }
  }, [universe, isEdit]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.length < 3) {
      newErrors.name = "Name must be at least 3 characters";
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = "Description must be less than 500 characters";
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
        is_public: formData.is_public,
      };

      // Call the appropriate API function based on whether we're editing
      const result = isEdit
        ? await dispatch(
            updateUniverse({ id: universe.id, ...universeData })
          ).unwrap()
        : await dispatch(createUniverse(universeData)).unwrap();

      console.log(
        `UniverseModalFinal - ${isEdit ? "Update" : "Create"} result:`,
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
          "UniverseModalFinal - Calling onSuccess with data:",
          universeData
        );
        onSuccess(universeData);
      }
    } catch (err) {
      console.error("UniverseModalFinal - Failed to save universe:", err);
      // Set form-wide error message
      setErrors((prev) => ({
        ...prev,
        form: err.message || "Failed to save universe. Please try again.",
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Universe" : "Create Universe"}
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
        />

        <Input
          label="Description"
          name="description"
          type="textarea"
          value={formData.description}
          onChange={handleChange}
          error={errors.description}
          rows={3}
          className="compact-input"
        />

        <div className="checkbox-field">
          <input
            type="checkbox"
            id="is_public"
            name="is_public"
            checked={formData.is_public}
            onChange={handleChange}
          />
          <label htmlFor="is_public">Make this universe public</label>
        </div>

        {errors.form && <div className="form-error-message">{errors.form}</div>}

        <div className="modal-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : isEdit
              ? "Update Universe"
              : "Create Universe"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

UniverseModalFinal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  universe: PropTypes.object,
  isEdit: PropTypes.bool,
};

export default UniverseModalFinal;
