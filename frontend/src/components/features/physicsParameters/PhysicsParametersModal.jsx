import React, { useEffect, useState } from 'react';
import { api, endpoints } from '../../../utils/api';
import Button from '../../common/Button';
import Input from '../../common/Input';
import Spinner from '../../common/Spinner';
import './PhysicsParameters.css';

// Default physics parameters matching backend model
const DEFAULT_PHYSICS_PARAMS = {
  version: 1,
  is_active: true,
  gravity: {
    value: 9.81,
    unit: 'm/s²',
    min: 0,
    max: 20,
    enabled: true,
  },
  air_resistance: {
    value: 0.1,
    unit: 'kg/m³',
    min: 0,
    max: 1,
    enabled: true,
  },
  collision_elasticity: {
    value: 0.7,
    unit: 'coefficient',
    min: 0,
    max: 1,
    enabled: true,
  },
  friction: {
    value: 0.3,
    unit: 'coefficient',
    min: 0,
    max: 1,
    enabled: true,
  },
  temperature: {
    value: 293.15,
    unit: 'K',
    min: 0,
    max: 1000,
    enabled: true,
  },
  pressure: {
    value: 101.325,
    unit: 'kPa',
    min: 0,
    max: 200,
    enabled: true,
  },
  fluid_density: {
    value: 1.225,
    unit: 'kg/m³',
    min: 0,
    max: 2000,
    enabled: false,
  },
  viscosity: {
    value: 1.81e-5,
    unit: 'Pa·s',
    min: 0,
    max: 1,
    enabled: false,
  },
  time_step: {
    value: 0.016,
    unit: 's',
    min: 0.001,
    max: 0.1,
    enabled: true,
  },
  substeps: {
    value: 8,
    unit: 'steps',
    min: 1,
    max: 32,
    enabled: true,
  },
  custom_parameters: {},
};

const PhysicsParametersModal = ({
  sceneId,
  paramsId,
  onClose,
  onSuccess,
  mode = 'create',
  initialData = null,
}) => {
  // State for form data
  const [formData, setFormData] = useState({
    ...DEFAULT_PHYSICS_PARAMS,
    scene_id: sceneId,
  });

  // State for validation errors
  const [errors, setErrors] = useState({});

  // State for submission status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // State for loading
  const [isLoading, setIsLoading] = useState(
    mode === 'edit' || mode === 'view'
  );

  useEffect(() => {
    const fetchPhysicsParameters = async () => {
      if ((mode === 'edit' || mode === 'view') && paramsId) {
        try {
          setIsLoading(true);
          const response = await api.get(
            endpoints.scenes.physicsParameters.detail(sceneId, paramsId)
          );
          setFormData({
            ...response.data,
            scene_id: sceneId,
          });
        } catch (error) {
          console.error('Error fetching physics parameters:', error);
          setSubmitError(
            'Failed to load physics parameters. Please try again.'
          );
        } finally {
          setIsLoading(false);
        }
      }
    };

    if (initialData && (mode === 'edit' || mode === 'view')) {
      setFormData({
        ...initialData,
        scene_id: sceneId,
      });
      setIsLoading(false);
    } else {
      fetchPhysicsParameters();
    }
  }, [mode, paramsId, sceneId, initialData]);

  const handleInputChange = (paramName, field, value) => {
    setFormData(prevData => ({
      ...prevData,
      [paramName]: {
        ...prevData[paramName],
        [field]: field === 'value' ? parseFloat(value) : value,
      },
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      let response;
      if (mode === 'create') {
        response = await api.post(
          endpoints.scenes.physicsParameters.create(sceneId),
          formData
        );
      } else if (mode === 'edit') {
        response = await api.put(
          endpoints.scenes.physicsParameters.update(sceneId, paramsId),
          formData
        );
      }

      onSuccess(response.data, mode);
    } catch (error) {
      console.error('Error submitting physics parameters:', error);
      setSubmitError('Failed to save physics parameters. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <div className="physics-parameters-modal">
      <h2>
        {mode === 'create' ? 'Create' : mode === 'edit' ? 'Edit' : 'View'}{' '}
        Physics Parameters
      </h2>

      <form onSubmit={handleSubmit}>
        {Object.entries(formData).map(([key, value]) => {
          if (
            key === 'scene_id' ||
            key === 'id' ||
            key === 'created_at' ||
            key === 'updated_at' ||
            key === 'custom_parameters'
          ) {
            return null;
          }

          if (typeof value === 'object' && value !== null) {
            return (
              <div key={key} className="parameter-group">
                <h3>{key.replace(/_/g, ' ').toUpperCase()}</h3>
                <div className="parameter-controls">
                  <Input
                    type="number"
                    label="Value"
                    value={value.value}
                    onChange={e =>
                      handleInputChange(key, 'value', e.target.value)
                    }
                    disabled={mode === 'view'}
                    step="any"
                    min={value.min}
                    max={value.max}
                  />
                  <div className="unit">{value.unit}</div>
                  <label>
                    <input
                      type="checkbox"
                      checked={value.enabled}
                      onChange={e =>
                        handleInputChange(key, 'enabled', e.target.checked)
                      }
                      disabled={mode === 'view'}
                    />
                    Enabled
                  </label>
                </div>
              </div>
            );
          }

          return null;
        })}

        {submitError && <div className="error-message">{submitError}</div>}

        <div className="modal-actions">
          {mode !== 'view' && (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Spinner size="small" /> : 'Save'}
            </Button>
          )}
          <Button onClick={onClose} variant="secondary">
            {mode === 'view' ? 'Close' : 'Cancel'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PhysicsParametersModal;
