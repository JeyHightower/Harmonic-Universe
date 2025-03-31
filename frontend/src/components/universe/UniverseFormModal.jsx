import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "../common";
import Input from "../common/Input";
import Modal from "../common/Modal";
import {
  createUniverse,
  updateUniverse,
} from "../../store/thunks/universeThunks";
import "../../styles/UniverseFormModal.css";

const UniverseFormModal = ({ isOpen, onClose, onSuccess, initialData }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.universes);
  const isEditing = !!initialData;
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
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        description: initialData.description || "",
        is_public: initialData.is_public || false,
      });
    }
  }, [initialData]);

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

    // Run validation before submission
    if (!validateForm()) {
      console.log("UniverseFormModal - Form validation failed");
      return; // Stop submission if validation fails
    }

    setIsSubmitting(true);
    console.log("UniverseFormModal - Submitting form...", formData);

    try {
      let result;
      if (isEditing) {
        // Update existing universe
        console.log("UniverseFormModal - Updating universe:", initialData.id);
        result = await dispatch(
          updateUniverse({
            id: initialData.id,
            ...formData,
          })
        ).unwrap();
      } else {
        // Create new universe
        console.log("UniverseFormModal - Creating new universe");
        result = await dispatch(createUniverse(formData)).unwrap();
      }

      console.log("UniverseFormModal - API call successful:", result);

      if (onSuccess) {
        // Extract the universe data - handle different possible response formats
        let universeData;

        if (result && typeof result === "object") {
          // Try different possible structures
          if (result.universe && typeof result.universe === "object") {
            // Case: { universe: {...} }
            universeData = result.universe;
          } else if (result.data && result.data.universe) {
            // Case: { data: { universe: {...} } }
            universeData = result.data.universe;
          } else if (result.id) {
            // Case: The result itself is the universe object
            universeData = result;
          } else {
            // Fallback
            console.warn(
              "UniverseFormModal - Unexpected response format:",
              result
            );
            universeData = result;
          }
        } else {
          // Unexpected non-object response
          console.warn(
            "UniverseFormModal - Unexpected non-object response:",
            result
          );
          universeData = result;
        }

        console.log(
          "UniverseFormModal - Calling onSuccess with extracted data:",
          universeData
        );
        onSuccess(universeData);
      }
    } catch (err) {
      console.error("UniverseFormModal - Failed to save universe:", err);
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
      title={isEditing ? "Edit Universe" : "Create Universe"}
      className="universe-form-modal"
      size="small"
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
          rows={2}
          className="compact-input"
        />

        <div className="checkbox-field">
          <input
            id="is_public"
            name="is_public"
            type="checkbox"
            checked={formData.is_public}
            onChange={handleChange}
          />
          <label htmlFor="is_public">Make universe public</label>
        </div>

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

UniverseFormModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  initialData: PropTypes.object,
};

UniverseFormModal.defaultProps = {
  onSuccess: null,
  initialData: null,
};

export default UniverseFormModal;
