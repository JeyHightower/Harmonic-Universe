import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  fetchUniverses,
  updateUniverse,
} from "../../store/thunks/universeThunks";
import { api, endpoints } from "../../utils/api";
import {
  validateDescription,
  validateUniverseName,
} from "../../utils/validation";
import { Button } from "../common";
import Input from "../common/Input";
import Modal from "../common/Modal";
import Spinner from "../common/Spinner";
import PhysicsPanel from "../physics/PhysicsPanel";
import "../../styles/Universe.css";

function UniverseEdit() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const { universes } = useSelector((state) => state.universe);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_public: false,
    physics_params: null,
  });
  const [originalFormData, setOriginalFormData] = useState(null);
  const [formErrors, setFormErrors] = useState({
    name: "",
    description: "",
  });
  const [canEdit, setCanEdit] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const fetchUniverseData = async () => {
    try {
      setLoading(true);
      const response = await api.get(endpoints.universes.detail(id));
      const newFormData = {
        name: response.name,
        description: response.description || "",
        is_public: response.is_public || false,
        physics_params: response.physics_params || null,
      };
      setFormData(newFormData);
      setOriginalFormData(JSON.stringify(newFormData));
      // Check if user has edit permissions
      setCanEdit(response.user_role === "owner");
      setLastFetchTime(Date.now());
    } catch (error) {
      console.error("Failed to fetch universe:", error);
      setError(error.response?.data?.message || "Failed to load universe");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch universes list if not loaded
    if (!universes) {
      dispatch(fetchUniverses());
    }
  }, [dispatch, universes]);

  useEffect(() => {
    fetchUniverseData();
  }, [id]);

  // Add effect to refresh data when component gains focus
  useEffect(() => {
    const handleFocus = () => {
      // Only refetch if it's been more than 5 seconds since last fetch
      if (Date.now() - lastFetchTime > 5000) {
        fetchUniverseData();
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [lastFetchTime]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear error when user starts typing
    setFormErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const validateForm = () => {
    const nameError = validateUniverseName(formData.name);
    const descriptionError = validateDescription(formData.description);

    setFormErrors({
      name: nameError,
      description: descriptionError,
    });

    return !nameError && !descriptionError;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Only send allowed fields for universe update
      const updateData = {
        name: formData.name,
        description: formData.description,
        is_public: formData.is_public,
      };

      await dispatch(
        updateUniverse({
          universeId: id,
          universeData: updateData,
        })
      ).unwrap();
      navigate(`/universes/${id}`);
    } catch (error) {
      console.error("Failed to update universe:", error);
      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to update universe"
      );
      setIsSubmitting(false);
    }
  };

  const hasUnsavedChanges = () => {
    if (!originalFormData) return false;

    const currentFormDataString = JSON.stringify({
      name: formData.name,
      description: formData.description,
      is_public: formData.is_public,
      // Exclude physics_params as they're saved separately
    });

    const originalDataWithoutPhysics = JSON.parse(originalFormData);
    delete originalDataWithoutPhysics.physics_params;
    const originalFormDataString = JSON.stringify(originalDataWithoutPhysics);

    return currentFormDataString !== originalFormDataString;
  };

  const handleCancelClick = () => {
    if (hasUnsavedChanges()) {
      setShowCancelModal(true);
    } else {
      navigate(`/universes/${id}`);
    }
  };

  const handleCancelConfirm = () => {
    setShowCancelModal(false);
    navigate(`/universes/${id}`);
  };

  const handleCancelModalClose = () => {
    setShowCancelModal(false);
  };

  const handlePhysicsParamsChange = (updatedParams) => {
    setFormData((prev) => ({
      ...prev,
      physics_params: updatedParams,
    }));
    // Reset last fetch time to prevent immediate refetch on focus
    setLastFetchTime(Date.now());
  };

  if (loading) {
    return (
      <div className="universe-container">
        <div className="universe-loading">
          <Spinner size="large" />
          <p>Loading universe details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="universe-container">
        <div className="universe-error">
          <p>{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="universe-edit">
      <h1>Edit Universe</h1>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <Input
          type="text"
          label="Universe Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          error={formErrors.name}
          required
        />
        <Input
          type="textarea"
          label="Description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          error={formErrors.description}
          required
        />
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              name="is_public"
              checked={formData.is_public}
              onChange={handleChange}
            />
            Make Universe Public
          </label>
        </div>

        <PhysicsPanel
          universeId={id}
          initialPhysicsParams={formData.physics_params}
          readOnly={!canEdit}
          onPhysicsParamsChange={handlePhysicsParamsChange}
        />

        <div className="form-actions">
          <Button type="submit" disabled={isSubmitting} loading={isSubmitting}>
            Save Changes
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleCancelClick}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={handleCancelModalClose}
        title="Unsaved Changes"
      >
        <div>
          <p>
            You have unsaved changes. Are you sure you want to leave without
            saving?
          </p>
          <div className="modal-actions">
            <Button variant="danger" onClick={handleCancelConfirm}>
              Discard Changes
            </Button>
            <Button variant="secondary" onClick={handleCancelModalClose}>
              Continue Editing
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default UniverseEdit;
