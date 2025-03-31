import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useModal } from "../../contexts/ModalContext";
import { updatePhysicsParams } from "../../../store/thunks/universeThunks";
import { MODAL_TYPES } from "../../constants/modalTypes";
import Button from "../../common/Button";
import "./Universe.css";

const DEFAULT_PHYSICS_PARAMS = {
  gravity: {
    value: 9.81,
    unit: "m/s²",
    min: 0.01,
    max: 20,
    warning_threshold: 1.0,
  },
  air_resistance: {
    value: 0.0,
    unit: "kg/m³",
    min: 0,
    max: 1,
    warning_threshold: 0.001,
  },
  elasticity: {
    value: 1.0,
    unit: "coefficient",
    min: 0.1,
    max: 1,
    warning_threshold: 0.2,
  },
  friction: {
    value: 0.1,
    unit: "coefficient",
    min: 0.01,
    max: 1,
    warning_threshold: 0.05,
  },
  temperature: {
    value: 293.15,
    unit: "K",
    min: 1,
    max: 1000,
    warning_threshold: 50,
  },
  pressure: {
    value: 101.325,
    unit: "kPa",
    min: 0.1,
    max: 200,
    warning_threshold: 10,
  },
};

function PhysicsPanel({
  universeId,
  initialPhysicsParams,
  readOnly = false,
  onPhysicsParamsChange,
}) {
  const dispatch = useDispatch();
  const { openModalByType } = useModal();
  const currentUniverse = useSelector(
    (state) => state.universe.currentUniverse
  );
  const [physicsParams, setPhysicsParams] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSubmittedValues, setLastSubmittedValues] = useState(null);

  // Check if user has permission to edit - handle loading state properly
  const canEdit =
    !readOnly &&
    // If we're still loading universe data, respect the readOnly prop
    (currentUniverse === null
      ? !readOnly
      : // Once loaded, check actual permissions
        currentUniverse?.user_role === "owner");

  // Initialize and sync with props/store
  useEffect(() => {
    if (!universeId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    // Always prioritize Redux store data if available
    if (currentUniverse?.id === universeId && currentUniverse?.physics_params) {
      const storeParams = JSON.parse(
        JSON.stringify(currentUniverse.physics_params)
      );
      const updatedParams = Object.entries(storeParams).reduce(
        (acc, [key, param]) => ({
          ...acc,
          [key]: {
            ...DEFAULT_PHYSICS_PARAMS[key], // Keep metadata
            ...param, // Override with store values
          },
        }),
        {}
      );
      setPhysicsParams(updatedParams);
      setLastSubmittedValues(extractValues(updatedParams));
      setIsLoading(false);
    }
    // Fallback to prop data if available
    else if (initialPhysicsParams) {
      setPhysicsParams(initialPhysicsParams);
      setLastSubmittedValues(extractValues(initialPhysicsParams));
      setIsLoading(false);
    }
    // Fallback to defaults if no data
    else {
      setPhysicsParams(DEFAULT_PHYSICS_PARAMS);
      setLastSubmittedValues(extractValues(DEFAULT_PHYSICS_PARAMS));
      setIsLoading(false);
    }
  }, [universeId, currentUniverse, initialPhysicsParams]);

  // Extract just the values (without metadata) for comparisons
  const extractValues = (params) => {
    if (!params) return {};
    return Object.entries(params).reduce(
      (acc, [key, param]) => ({
        ...acc,
        [key]: param.value,
      }),
      {}
    );
  };

  // Handle edit button click to open the physics settings modal
  const handleOpenPhysicsModal = () => {
    openModalByType(MODAL_TYPES.PHYSICS_PARAMETERS, {
      universeId,
      initialData: physicsParams,
      onSave: handleSavePhysicsParams,
    });
  };

  // Handle saving physics parameters from the modal
  const handleSavePhysicsParams = async (updatedParams) => {
    setIsSubmitting(true);

    try {
      // Update local state
      setPhysicsParams(updatedParams);

      // Extract values for API submission
      const physicsValues = extractValues(updatedParams);
      setLastSubmittedValues(physicsValues);

      // Dispatch Redux action to update backend
      if (universeId) {
        await dispatch(
          updatePhysicsParams({
            universeId,
            physicsParams: physicsValues,
          })
        ).unwrap();
      }

      // Notify parent component if callback provided
      if (onPhysicsParamsChange) {
        onPhysicsParamsChange(updatedParams);
      }

      return true;
    } catch (error) {
      console.error("Failed to update physics parameters:", error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format values for display
  const formatPhysicsValue = (value, unit) => {
    if (typeof value !== "number") return "N/A";

    // Handle decimal precision based on the range
    let formattedValue;
    if (value < 0.01) {
      formattedValue = value.toExponential(2);
    } else if (value < 1) {
      formattedValue = value.toFixed(3);
    } else if (value < 10) {
      formattedValue = value.toFixed(2);
    } else if (value < 100) {
      formattedValue = value.toFixed(1);
    } else {
      formattedValue = value.toFixed(0);
    }

    return `${formattedValue} ${unit}`;
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="physics-panel physics-panel-loading">
        <div className="physics-panel-header">
          <h2>Physics Properties</h2>
        </div>
        <div className="physics-panel-content">
          <div className="physics-loading-placeholder"></div>
        </div>
      </div>
    );
  }

  if (!physicsParams) return null;

  return (
    <div className="physics-panel">
      <div className="physics-panel-header">
        <h2>Physics Properties</h2>
        {canEdit && (
          <Button
            variant="primary"
            onClick={handleOpenPhysicsModal}
            disabled={isSubmitting}
          >
            Edit Physics
          </Button>
        )}
      </div>

      <div className="physics-panel-content">
        <div className="physics-grid">
          {Object.entries(physicsParams).map(([key, param]) => (
            <div key={key} className="physics-property">
              <div className="physics-property-label">
                {key.charAt(0).toUpperCase() + key.slice(1).replace("_", " ")}
              </div>
              <div className="physics-property-value">
                {formatPhysicsValue(param.value, param.unit)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PhysicsPanel;
