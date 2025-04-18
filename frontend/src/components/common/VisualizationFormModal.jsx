import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "./Button";
import Icon from "./Icon";
import Input from "./Input";
import Modal from "./Modal";
import Spinner from "../../components/common/Spinner";
import "../../styles/Modal.css";
import { API_CONFIG } from "../../utils/config";

/**
 * Modal for creating and editing visualizations.
 * @param {Object} props - Component props
 * @param {string} props.universeId - ID of the universe (for create)
 * @param {string} props.sceneId - ID of the scene (for create)
 * @param {string} props.visualizationId - ID of the visualization (for edit)
 * @param {Object} props.initialData - Initial data for editing
 * @param {Function} props.onClose - Function to call when the modal is closed
 * @param {Object} props.modalProps - Props for the Modal component
 * @param {boolean} props.isGlobalModal - Whether this modal is opened globally
 */
const VisualizationFormModal = ({
  universeId,
  sceneId,
  visualizationId,
  initialData,
  onClose,
  modalProps = {},
  isGlobalModal = false,
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(!!visualizationId);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "PARTICLE",
    parameters: {
      particleCount: 100,
      particleSize: 5,
      particleColor: "#00AAFF",
      backgroundColor: "#000000",
      speedFactor: 1.0,
    },
  });

  // Visualization types
  const visualizationTypes = [
    { value: "PARTICLE", label: "Particle System" },
    { value: "WAVEFORM", label: "Waveform" },
    { value: "SPECTRUM", label: "Frequency Spectrum" },
    { value: "CIRCULAR", label: "Circular" },
  ];

  // Fetch visualization data if editing
  useEffect(() => {
    const fetchVisualizationData = async () => {
      if (!visualizationId) return;

      try {
        const response = await fetch(`/api/visualizations/${visualizationId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch visualization data");
        }

        const data = await response.json();
        setFormData({
          name: data.name,
          type: data.type,
          parameters: data.parameters || {
            particleCount: 100,
            particleSize: 5,
            particleColor: "#00AAFF",
            backgroundColor: "#000000",
            speedFactor: 1.0,
          },
        });
      } catch (err) {
        setError(
          err.message || "An error occurred while fetching visualization data"
        );
      } finally {
        setFetchLoading(false);
      }
    };

    fetchVisualizationData();
  }, [visualizationId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleParameterChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    // Convert numeric fields to numbers
    if (["particleCount", "particleSize", "speedFactor"].includes(name)) {
      processedValue = parseFloat(value);
    }

    setFormData({
      ...formData,
      parameters: {
        ...formData.parameters,
        [name]: processedValue,
      },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = visualizationId
        ? `/api/visualizations/${visualizationId}`
        : `/api/visualizations`;

      const method = visualizationId ? "PUT" : "POST";

      // Prepare data for API
      const apiData = {
        ...formData,
        universe_id: universeId,
        scene_id: sceneId,
      };

      // Don't include IDs in the body for edit requests
      if (visualizationId) {
        delete apiData.universe_id;
        delete apiData.scene_id;
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            `Failed to ${visualizationId ? "update" : "create"} visualization`
        );
      }

      // Close the modal and redirect if necessary
      onClose();

      if (isGlobalModal) {
        navigate(`/universes/${universeId}`);
      }
    } catch (err) {
      setError(err.message || "An error occurred while saving visualization");
    } finally {
      setLoading(false);
    }
  };

  // Determine if we're creating or editing
  const isEditing = !!visualizationId;

  // Show loading spinner while fetching existing data
  if (fetchLoading) {
    return (
      <Modal
        {...modalProps}
        onClose={onClose}
        className="visualization-form-modal"
      >
        <div className="modal-body centered">
          <Spinner size="medium" />
          <p>Loading visualization data...</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      {...modalProps}
      onClose={onClose}
      className="visualization-form-modal"
    >
      <div className="modal-header">
        <h2>
          {modalProps.title ||
            (isEditing ? "Edit Visualization" : "Create Visualization")}
        </h2>
      </div>

      <div className="modal-body">
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Visualization Name</label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter a name for this visualization"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="type">Visualization Type</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="form-control"
              required
            >
              {visualizationTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <fieldset className="parameters-fieldset">
            <legend>Visualization Parameters</legend>

            {formData.type === "PARTICLE" && (
              <>
                <div className="form-group">
                  <label htmlFor="particleCount">Particle Count</label>
                  <Input
                    id="particleCount"
                    name="particleCount"
                    type="number"
                    min="10"
                    max="1000"
                    value={formData.parameters.particleCount}
                    onChange={handleParameterChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="particleSize">Particle Size</label>
                  <Input
                    id="particleSize"
                    name="particleSize"
                    type="number"
                    min="1"
                    max="20"
                    step="0.5"
                    value={formData.parameters.particleSize}
                    onChange={handleParameterChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="particleColor">Particle Color</label>
                  <Input
                    id="particleColor"
                    name="particleColor"
                    type="color"
                    value={formData.parameters.particleColor}
                    onChange={handleParameterChange}
                    required
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label htmlFor="backgroundColor">Background Color</label>
              <Input
                id="backgroundColor"
                name="backgroundColor"
                type="color"
                value={formData.parameters.backgroundColor}
                onChange={handleParameterChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="speedFactor">Speed Factor</label>
              <Input
                id="speedFactor"
                name="speedFactor"
                type="number"
                min="0.1"
                max="5.0"
                step="0.1"
                value={formData.parameters.speedFactor}
                onChange={handleParameterChange}
                required
              />
            </div>
          </fieldset>

          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? (
                <Spinner size="small" />
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Create Visualization"
              )}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

VisualizationFormModal.propTypes = {
  universeId: PropTypes.string,
  sceneId: PropTypes.string,
  visualizationId: PropTypes.string,
  initialData: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  modalProps: PropTypes.object,
  isGlobalModal: PropTypes.bool,
};

export default VisualizationFormModal;
