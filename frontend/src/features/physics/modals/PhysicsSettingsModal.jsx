import React, { useState, useEffect } from "react";
import PropTypes from 'prop-types';
import Button from "../../../components/common/Button";
import Input from "../../../components/common/Input";
import Modal from "../../../components/common/Modal";
import "../../../styles/Modal.css";

const PhysicsSettingsModal = ({ initialPhysicsParams, onSave, onClose }) => {
  const [physicsParams, setPhysicsParams] = useState(initialPhysicsParams);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setPhysicsParams(initialPhysicsParams);
  }, [initialPhysicsParams]);

  const validateParameter = (name, value) => {
    if (typeof value === "number") {
      const param = physicsParams[name];
      if (value < param.min || value > param.max) {
        return `Value must be between ${param.min} and ${param.max}`;
      }

      // Warning if value is near min/max threshold
      if (
        value <= param.min + param.warning_threshold ||
        value >= param.max - param.warning_threshold
      ) {
        return `Value is close to ${
          value <= param.min + param.warning_threshold ? "minimum" : "maximum"
        } limit`;
      }
    }
    return null;
  };

  const handleParameterChange = (name, value) => {
    // Validate numeric input
    const errorMessage = validateParameter(name, value);

    // Update params state
    setPhysicsParams((prev) => ({
      ...prev,
      [name]: {
        ...prev[name],
        value: value,
      },
    }));

    // Update errors state
    setErrors((prev) => ({
      ...prev,
      [name]: errorMessage,
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Check for errors before submitting
      const hasErrors = Object.values(errors).some((error) => error !== null);
      if (hasErrors) {
        throw new Error("Please fix the errors before saving.");
      }

      // Call the onSave callback with the updated physics parameters
      await onSave(physicsParams);
      onClose();
    } catch (error) {
      console.error("Error saving physics parameters:", error);
      // Handle the error (you might want to display an error message)
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderPhysicsParameter = (key, param) => {
    const hasError = errors[key] !== undefined && errors[key] !== null;
    const isWarning = errors[key]?.includes("close to");

    return (
      <div className="physics-parameter" key={key}>
        <Input
          label={`${
            key.charAt(0).toUpperCase() + key.slice(1).replace("_", " ")
          } (${param.unit})`}
          type="number"
          value={param.value}
          onChange={(value) => handleParameterChange(key, parseFloat(value))}
          min={param.min}
          max={param.max}
          step={(param.max - param.min) / 100}
          error={hasError && !isWarning ? errors[key] : null}
          warning={isWarning ? errors[key] : null}
        />
      </div>
    );
  };

  return (
    <div className="physics-settings-modal">
      <div className="modal-content">
        <h2>Physics Settings</h2>
        <p className="modal-description">
          Adjust the physical laws and properties of your universe. These
          settings will affect how objects interact within your simulation.
        </p>

        <div className="physics-parameters-grid">
          {Object.entries(physicsParams).map(([key, param]) =>
            renderPhysicsParameter(key, param)
          )}
        </div>

        <div className="modal-actions">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={isSubmitting}
            disabled={
              isSubmitting ||
              Object.values(errors).some(
                (error) => error !== null && !error.includes("close to")
              )
            }
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

PhysicsSettingsModal.propTypes = {
  universeId: PropTypes.string.isRequired,
  initialPhysicsParams: PropTypes.object,
  onSave: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
};

export default PhysicsSettingsModal;
