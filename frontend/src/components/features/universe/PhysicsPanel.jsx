import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentUniverse } from '../../../store/slices/universeSlice';
import { updatePhysicsParams } from '../../../store/thunks/universeThunks';
import Button from '../../common/Button';
import Input from '../../common/Input';
import './Universe.css';

const DEFAULT_PHYSICS_PARAMS = {
  gravity: {
    value: 9.81,
    unit: 'm/s²',
    min: 0.01,
    max: 20,
    warning_threshold: 1.0,
  },
  air_resistance: {
    value: 0.0,
    unit: 'kg/m³',
    min: 0,
    max: 1,
    warning_threshold: 0.001,
  },
  elasticity: {
    value: 1.0,
    unit: 'coefficient',
    min: 0.1,
    max: 1,
    warning_threshold: 0.2,
  },
  friction: {
    value: 0.1,
    unit: 'coefficient',
    min: 0.01,
    max: 1,
    warning_threshold: 0.05,
  },
  temperature: {
    value: 293.15,
    unit: 'K',
    min: 1,
    max: 1000,
    warning_threshold: 50,
  },
  pressure: {
    value: 101.325,
    unit: 'kPa',
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
  const currentUniverse = useSelector(state => state.universe.currentUniverse);
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
        currentUniverse?.user_role === 'owner');

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
      setLastSubmittedValues(updatedParams);
    } else {
      // Fall back to initialPhysicsParams or defaults
      const sourceParams = initialPhysicsParams || DEFAULT_PHYSICS_PARAMS;
      const updatedParams = Object.entries(sourceParams).reduce(
        (acc, [key, param]) => ({
          ...acc,
          [key]: {
            ...DEFAULT_PHYSICS_PARAMS[key], // Keep metadata
            ...param, // Override with provided values
          },
        }),
        {}
      );
      setPhysicsParams(updatedParams);
      setLastSubmittedValues(updatedParams);
    }
    setIsLoading(false);
  }, [currentUniverse?.id, universeId, currentUniverse?.physics_params]);

  // Sync with Redux store updates
  useEffect(() => {
    if (
      currentUniverse?.id === universeId &&
      currentUniverse?.physics_params &&
      physicsParams
    ) {
      setIsLoading(true);
      const storeParams = JSON.parse(
        JSON.stringify(currentUniverse.physics_params)
      );
      if (!arePhysicsParamsEqual(storeParams, physicsParams)) {
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
        setLastSubmittedValues(updatedParams);
      }
      setIsLoading(false);
    }
  }, [currentUniverse?.physics_params]);

  const validateParameter = (name, value) => {
    const param = physicsParams[name];
    if (value < param.min || value > param.max) {
      return `Value must be between ${param.min} and ${param.max} ${param.unit}`;
    }

    // Add warnings for extreme values
    if (value < param.warning_threshold) {
      return `Warning: ${name.replace(/_/g, ' ')} is very low. Are you sure?`;
    }

    return '';
  };

  const handleParameterChange = (name, value) => {
    console.log('Parameter change:', { name, value });

    // Clear all errors when user starts editing
    setErrors({});

    // Handle empty input case
    if (value === '') {
      setErrors(prev => ({
        ...prev,
        [name]: `Value is required`,
      }));
      return;
    }

    const numValue = parseFloat(value);

    // Handle NaN case
    if (isNaN(numValue)) {
      setErrors(prev => ({
        ...prev,
        [name]: `Please enter a valid number`,
      }));
      return;
    }

    const error = validateParameter(name, numValue);
    console.log('Validation error:', error);

    // Update errors - remove error if value is valid
    if (error) {
      setErrors(prev => ({
        ...prev,
        [name]: error,
      }));
    }

    setPhysicsParams(prev => {
      const newParams = {
        ...prev,
        [name]: {
          ...prev[name],
          value: numValue,
        },
      };
      console.log('New physics params:', newParams);
      return newParams;
    });
  };

  const handleSubmit = async () => {
    if (isSubmitting || Object.keys(errors).length > 0) return;

    try {
      setIsSubmitting(true);
      setErrors({});

      // Check if values have actually changed
      if (arePhysicsParamsEqual(physicsParams, lastSubmittedValues)) {
        console.log('No changes to submit');
        return;
      }

      const cleanPhysicsParams = cleanupPhysicsParams(physicsParams);

      console.debug('Submitting physics update:', {
        universeId,
        currentRole: currentUniverse?.user_role,
        hasChanges: true,
      });

      // Attempt to update physics parameters
      const result = await dispatch(
        updatePhysicsParams({
          universeId,
          physicsParams: cleanPhysicsParams,
        })
      ).unwrap();

      if (result) {
        console.debug('Physics update successful:', {
          universeId,
          newRole: result.user_role,
          hasPhysicsParams: !!result.physics_params,
        });

        // Update local state with the server response
        const serverPhysicsParams = result.physics_params;

        // Preserve metadata while using server values
        const updatedParams = Object.entries(serverPhysicsParams).reduce(
          (acc, [key, param]) => ({
            ...acc,
            [key]: {
              ...physicsParams[key], // Keep metadata (min, max, etc.)
              value: param.value,
              unit: param.unit,
            },
          }),
          {}
        );

        setPhysicsParams(updatedParams);
        setLastSubmittedValues(updatedParams);
        setErrors({});

        // Update parent component with cleaned server response
        if (onPhysicsParamsChange) {
          onPhysicsParamsChange(serverPhysicsParams);
        }

        // Update universe data in Redux store
        if (currentUniverse && result.id === currentUniverse.id) {
          dispatch(setCurrentUniverse(result));
        }
      }
    } catch (error) {
      console.error('Physics update error:', error);

      // Handle authentication errors
      if (error.status === 401 || error.message === 'Authentication required') {
        setErrors({
          submit: 'Your session has expired. Please log in again.',
        });
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        return;
      }

      // Handle authorization errors
      if (error.status === 403 || error.error_code === 'AUTHORIZATION_ERROR') {
        const errorDetails = error.details || {};
        const errorMessage =
          errorDetails.user_role === null
            ? 'You do not have permission to update this universe.'
            : `Insufficient permissions: ${errorDetails.user_role} role cannot update physics parameters.`;

        setErrors({
          submit: errorMessage,
        });

        // Update local permission state
        if (currentUniverse) {
          dispatch(
            setCurrentUniverse({
              ...currentUniverse,
              user_role: errorDetails.user_role || null,
            })
          );
        }
        return;
      }

      setErrors({
        submit: error.message || 'Failed to update physics parameters.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to compare physics parameters
  const arePhysicsParamsEqual = (params1, params2) => {
    if (!params1 || !params2) return false;

    return Object.entries(params1).every(([key, param1]) => {
      const param2 = params2[key];
      if (!param2) return false;

      const value1 = parseFloat(param1.value);
      const value2 = parseFloat(param2.value);

      return (
        !isNaN(value1) && !isNaN(value2) && Math.abs(value1 - value2) < 0.0001
      );
    });
  };

  // Helper function to clean physics parameters for submission
  const cleanupPhysicsParams = params => {
    return Object.entries(params).reduce(
      (acc, [key, param]) => ({
        ...acc,
        [key]: {
          value: param.value,
          unit: param.unit,
        },
      }),
      {}
    );
  };

  return (
    <div className="physics-panel">
      <h2>Physics Parameters</h2>
      {errors.submit && <div className="error-message">{errors.submit}</div>}
      {isLoading ? (
        <div className="physics-loading">Loading physics parameters...</div>
      ) : (
        <>
          <div className="physics-parameters">
            {physicsParams &&
              Object.entries(physicsParams).map(([name]) => (
                <div key={name} className="parameter-group">
                  <Input
                    type="number"
                    name={name}
                    label={name.replace(/_/g, ' ').toUpperCase()}
                    value={isNaN(param.value) ? '' : param.value.toString()}
                    onChange={e => handleParameterChange(name, e.target.value)}
                    error={errors[name]}
                    disabled={readOnly || !canEdit}
                    step="any"
                    min={param.min}
                    max={param.max}
                    suffix={param.unit}
                  />
                </div>
              ))}
          </div>
          {!readOnly && canEdit && (
            <div className="physics-actions">
              <Button
                onClick={handleSubmit}
                disabled={
                  isSubmitting ||
                  (Object.keys(errors).length > 0 && !errors.submit)
                }
                loading={isSubmitting}
              >
                Update Physics Parameters
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default PhysicsPanel;
