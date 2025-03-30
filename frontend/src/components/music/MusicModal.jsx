import React, { useEffect, useState } from "react";
import apiClient from "../../utils/api";
import Button from "../common/Button";
import Icon from "../common/Icon";
import Input from "../common/Input";
import Spinner from "../common/Spinner";
import "./Music.css";

// Default music parameters
const DEFAULT_MUSIC_PARAMS = {
  name: "",
  description: "",
  tempo: 120,
  scale_type: "major",
  root_note: "C",
  melody_complexity: 0.5,
  universe_id: null,
};

// Scale options for the dropdown
const SCALE_OPTIONS = [
  { value: "major", label: "Major" },
  { value: "minor", label: "Minor" },
  { value: "harmonic_minor", label: "Harmonic Minor" },
  { value: "melodic_minor", label: "Melodic Minor" },
  { value: "pentatonic", label: "Pentatonic" },
  { value: "blues", label: "Blues" },
  { value: "dorian", label: "Dorian" },
  { value: "phrygian", label: "Phrygian" },
  { value: "lydian", label: "Lydian" },
  { value: "mixolydian", label: "Mixolydian" },
  { value: "locrian", label: "Locrian" },
];

// Root note options for the dropdown
const ROOT_NOTE_OPTIONS = [
  { value: "C", label: "C" },
  { value: "C#", label: "C#" },
  { value: "D", label: "D" },
  { value: "D#", label: "D#" },
  { value: "E", label: "E" },
  { value: "F", label: "F" },
  { value: "F#", label: "F#" },
  { value: "G", label: "G" },
  { value: "G#", label: "G#" },
  { value: "A", label: "A" },
  { value: "A#", label: "A#" },
  { value: "B", label: "B" },
];

const MusicModal = ({
  universeId,
  musicId = null,
  onClose,
  onSuccess,
  mode = "create",
  initialData = {},
}) => {
  const [formData, setFormData] = useState({
    ...DEFAULT_MUSIC_PARAMS,
    universe_id: universeId,
    ...initialData,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(mode === "edit" || mode === "view");
  const [generateInProgress, setGenerateInProgress] = useState(false);

  // Modal title based on the mode
  const getModalTitle = () => {
    switch (mode) {
      case "create":
        return "Create New Music";
      case "edit":
        return "Edit Music Settings";
      case "view":
        return "Music Details";
      case "delete":
        return "Delete Music";
      default:
        return "Music";
    }
  };

  // Fetch music data if in edit or view mode
  useEffect(() => {
    const fetchMusicData = async () => {
      if (musicId && (mode === "edit" || mode === "view")) {
        try {
          setLoading(true);
          const response = await apiClient.get(`${apiClient.music}/${musicId}`);
          setFormData({
            ...response.data,
            universe_id: universeId,
          });
        } catch (error) {
          console.error("Error fetching music data:", error);
          setErrors({ api: "Failed to load music data. Please try again." });
        } finally {
          setLoading(false);
        }
      }
    };

    fetchMusicData();
  }, [musicId, mode, universeId]);

  // Update form data with values from initialData prop
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData((prev) => ({
        ...prev,
        ...initialData,
        universe_id: universeId,
      }));
    }
  }, [initialData, universeId]);

  // Handle input changes and clear errors
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for the field being changed
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Validate individual field
  const validateField = (field, value) => {
    switch (field) {
      case "name":
        if (!value) return "Name is required";
        if (value.length > 100) return "Name cannot exceed 100 characters";
        return null;
      case "description":
        if (value && value.length > 500)
          return "Description cannot exceed 500 characters";
        return null;
      case "tempo":
        if (value < 60 || value > 200)
          return "Tempo must be between 60 and 200 BPM";
        return null;
      default:
        return null;
    }
  };

  // Validate the entire form
  const validateForm = () => {
    const newErrors = {};

    // Validate each field
    Object.keys(formData).forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (mode === "delete") {
      await handleDelete();
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);
    setSuccessMessage("");

    try {
      let response;

      if (mode === "create") {
        // Create new music settings
        response = await apiClient.post(apiClient.music, formData);
        setSuccessMessage("Music settings created successfully");
      } else if (mode === "edit") {
        // Update existing music settings
        response = await apiClient.put(
          `${apiClient.music}/${musicId}`,
          formData
        );
        setSuccessMessage("Music settings updated successfully");
      }

      // Call the onSuccess callback with the response data
      if (onSuccess) onSuccess(response.data, mode);

      // Close the modal after a short delay to show the success message
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error(
        `Error ${mode === "create" ? "creating" : "updating"} music:`,
        error
      );
      setErrors({
        api: `Failed to ${
          mode === "create" ? "create" : "update"
        } music settings. Please try again.`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle music deletion
  const handleDelete = async () => {
    setIsSubmitting(true);

    try {
      await apiClient.delete(`${apiClient.music}/${musicId}`);
      setSuccessMessage("Music deleted successfully");

      // Call the onSuccess callback
      if (onSuccess) onSuccess({ id: musicId }, "delete");

      // Close the modal after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Error deleting music:", error);
      setErrors({ api: "Failed to delete music. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle music generation
  const handleGenerate = async () => {
    if (!validateForm()) return;

    setGenerateInProgress(true);
    setSuccessMessage("");

    try {
      const response = await apiClient.post(
        `${apiClient.music}/generate`,
        formData
      );
      setSuccessMessage("Music generated successfully");

      // Update form data with the generated music data
      setFormData((prev) => ({
        ...prev,
        ...response.data,
      }));

      // Call the onSuccess callback
      if (onSuccess) onSuccess(response.data, "generate");
    } catch (error) {
      console.error("Error generating music:", error);
      setErrors({ api: "Failed to generate music. Please try again." });
    } finally {
      setGenerateInProgress(false);
    }
  };

  // Render modal content based on loading state and mode
  const renderModalContent = () => {
    if (loading) {
      return (
        <div className="modal-loading">
          <Spinner size="large" />
          <p>Loading music data...</p>
        </div>
      );
    }

    if (mode === "delete") {
      return (
        <div className="delete-confirmation">
          <h3>Delete Music</h3>
          <p>
            Are you sure you want to delete this music? This action cannot be
            undone.
          </p>
          <div className="modal-actions">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleSubmit}
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              Delete
            </Button>
          </div>
        </div>
      );
    }

    const isViewOnly = mode === "view";

    return (
      <>
        {successMessage && (
          <div className="success-message">{successMessage}</div>
        )}

        {errors.api && <div className="error-message">{errors.api}</div>}

        <div className="form-group">
          <Input
            label="Name"
            type="text"
            value={formData.name}
            onChange={(value) => handleInputChange("name", value)}
            error={errors.name}
            disabled={isViewOnly}
            required
          />
        </div>

        <div className="form-group">
          <Input
            label="Description"
            type="textarea"
            value={formData.description}
            onChange={(value) => handleInputChange("description", value)}
            error={errors.description}
            disabled={isViewOnly}
          />
        </div>

        <div className="form-group">
          <Input
            label="Tempo (BPM)"
            type="number"
            min={60}
            max={200}
            value={formData.tempo}
            onChange={(value) => handleInputChange("tempo", Number(value))}
            error={errors.tempo}
            disabled={isViewOnly}
          />
        </div>

        <div className="form-group">
          <label>Scale Type</label>
          <select
            value={formData.scale_type}
            onChange={(e) => handleInputChange("scale_type", e.target.value)}
            disabled={isViewOnly}
          >
            {SCALE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Root Note</label>
          <select
            value={formData.root_note}
            onChange={(e) => handleInputChange("root_note", e.target.value)}
            disabled={isViewOnly}
          >
            {ROOT_NOTE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Melody Complexity</label>
          <Input
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={formData.melody_complexity}
            onChange={(value) =>
              handleInputChange("melody_complexity", parseFloat(value))
            }
            disabled={isViewOnly}
          />
          <div className="range-labels">
            <span>Simple</span>
            <span>Complex</span>
          </div>
        </div>

        <div className="music-modal-actions">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>

          {!isViewOnly && (
            <Button
              variant="primary"
              onClick={handleSubmit}
              loading={isSubmitting}
              disabled={isSubmitting || generateInProgress}
            >
              {mode === "create" ? "Create" : "Update"}
            </Button>
          )}

          {(mode === "create" || mode === "edit") && (
            <Button
              variant="accent"
              onClick={handleGenerate}
              loading={generateInProgress}
              disabled={isSubmitting || generateInProgress}
            >
              <Icon name="music" /> Generate Music
            </Button>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="music-modal">
      <div className="music-modal-header">
        <div className="music-modal-title">
          <Icon name="music" /> {getModalTitle()}
        </div>
        <Button
          icon="close"
          variant="text"
          onClick={onClose}
          className="close-button"
        />
      </div>
      <div className="music-modal-content">{renderModalContent()}</div>
    </div>
  );
};

export default MusicModal;
