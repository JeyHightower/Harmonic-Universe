import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import apiClient from '../../../services/api.adapter';
import Button from '../../../components/common/Button';
import Icon from '../../../components/common/Icon';
import Input from '../../../components/common/Input';
import Spinner from '../../../components/common/Spinner';
import '../styles/PhysicsParameters.css';
import { endpoints } from '../../../services/endpoints';

// Default physics parameters
const DEFAULT_PHYSICS_PARAMS = {
  name: '',
  description: '',
  gravity_x: 0,
  gravity_y: -9.81,
  gravity_z: 0,
  time_scale: 1,
  air_resistance: 0.1,
  friction: 0.5,
  bounce_factor: 0.7,
  solver_iterations: 10,
  scene_id: null,
};

const PhysicsParametersModal = (props) => {
  // Extract props
  const { sceneId, paramsId, onClose, onSuccess, mode = 'create', initialData = null } = props;

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
  const [submitSuccess, setSubmitSuccess] = useState(null);

  // State for loading
  const [isLoading, setIsLoading] = useState(mode === 'edit' || mode === 'view');

  // Get modal title based on mode
  const getModalTitle = () => {
    switch (mode) {
      case 'create':
        return 'Create Physics Parameters';
      case 'edit':
        return 'Edit Physics Parameters';
      case 'view':
        return 'Physics Parameters Details';
      case 'delete':
        return 'Delete Physics Parameters';
      default:
        return 'Physics Parameters';
    }
  };

  // Fetch physics parameters data when in edit or view mode
  useEffect(() => {
    const fetchPhysicsParameters = async () => {
      if ((mode === 'edit' || mode === 'view' || mode === 'delete') && paramsId) {
        try {
          setIsLoading(true);
          const response = await apiClient.get(
            `${endpoints.scenes.detail(sceneId)}/physics_parameters/${paramsId}`
          );
          setFormData({
            ...response.data,
            scene_id: sceneId,
          });
        } catch (error) {
          console.error('Error fetching physics parameters:', error);
          setSubmitError('Failed to load physics parameters. Please try again.');
        } finally {
          setIsLoading(false);
        }
      }
    };

    // If initialData is provided, use it instead of fetching
    if (initialData && (mode === 'edit' || mode === 'view' || mode === 'delete')) {
      setFormData({
        ...initialData,
        scene_id: sceneId,
      });
      setIsLoading(false);
    } else {
      fetchPhysicsParameters();
    }
  }, [mode, paramsId, sceneId, initialData]);

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;

    // Convert numeric values
    const processedValue = type === 'number' ? parseFloat(value) : value;

    setFormData((prevData) => ({
      ...prevData,
      [name]: processedValue,
    }));

    // Clear error for the field
    if (errors[name]) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [name]: null,
      }));
    }
  };

  // Validate a specific field
  const validateField = (name, value) => {
    switch (name) {
      case 'name':
        if (!value || value.trim() === '') {
          return 'Name is required';
        }
        if (value.length > 100) {
          return 'Name must be less than 100 characters';
        }
        return null;
      case 'description':
        if (value && value.length > 500) {
          return 'Description must be less than 500 characters';
        }
        return null;
      case 'gravity_x':
      case 'gravity_y':
      case 'gravity_z':
        if (value === undefined || value === null || isNaN(value)) {
          return 'Gravity must be a valid number';
        }
        return null;
      case 'time_scale':
        if (value === undefined || value === null || isNaN(value)) {
          return 'Time scale must be a valid number';
        }
        if (value <= 0) {
          return 'Time scale must be greater than 0';
        }
        return null;
      case 'air_resistance':
        if (value === undefined || value === null || isNaN(value)) {
          return 'Air resistance must be a valid number';
        }
        if (value < 0) {
          return 'Air resistance must be greater than or equal to 0';
        }
        return null;
      case 'friction':
      case 'bounce_factor':
        if (value === undefined || value === null || isNaN(value)) {
          return 'Value must be a valid number';
        }
        if (value < 0 || value > 1) {
          return 'Value must be between 0 and 1';
        }
        return null;
      case 'solver_iterations':
        if (value === undefined || value === null || isNaN(value)) {
          return 'Solver iterations must be a valid number';
        }
        if (!Number.isInteger(Number(value)) || value < 1) {
          return 'Solver iterations must be a positive integer';
        }
        return null;
      default:
        return null;
    }
  };

  // Validate the entire form
  const validateForm = () => {
    const newErrors = {};

    // Validate each field
    Object.entries(formData).forEach(([key, value]) => {
      const error = validateField(key, value);
      if (error) {
        newErrors[key] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Don't submit if in view mode
    if (mode === 'view') {
      onClose();
      return;
    }

    // Don't validate in delete mode
    if (mode !== 'delete' && !validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      let response;

      if (mode === 'create') {
        // Create new physics parameters
        response = await apiClient.post(
          `${endpoints.scenes.detail(sceneId)}/physics_parameters`,
          formData
        );
        setSubmitSuccess('Physics parameters created successfully!');
      } else if (mode === 'edit') {
        // Update existing physics parameters
        response = await apiClient.put(
          `${endpoints.scenes.detail(sceneId)}/physics_parameters/${paramsId}`,
          formData
        );
        setSubmitSuccess('Physics parameters updated successfully!');
      } else if (mode === 'delete') {
        // Delete physics parameters
        response = await apiClient.delete(
          `${endpoints.scenes.detail(sceneId)}/physics_parameters/${paramsId}`
        );
        setSubmitSuccess('Physics parameters deleted successfully!');
      }

      // Call onSuccess with the response data and mode
      if (response && onSuccess) {
        onSuccess(response.data || formData, mode);
      }

      // Close modal after a delay
      window.setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error submitting physics parameters:', error);

      // Handle API validation errors
      if (error.response && error.response.data && error.response.data.errors) {
        setErrors(error.response.data.errors);
      } else {
        setSubmitError('An error occurred while processing your request. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render modal content based on mode
  const renderModalContent = () => {
    if (isLoading) {
      return (
        <div className="loading-container">
          <Spinner size="large" />
          <p>Loading physics parameters...</p>
        </div>
      );
    }

    if (mode === 'delete') {
      return (
        <div className="delete-confirmation">
          <Icon name="warning" size="large" />
          <p>
            Are you sure you want to delete{' '}
            <strong>{formData.name || 'these physics parameters'}</strong>?
          </p>
          <p>This action cannot be undone.</p>

          <div className="modal-actions">
            <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleSubmit} loading={isSubmitting}>
              Delete
            </Button>
          </div>

          {submitError && <div className="error-message">{submitError}</div>}
          {submitSuccess && <div className="success-message">{submitSuccess}</div>}
        </div>
      );
    }

    return (
      <form onSubmit={handleSubmit} className="physics-parameters-form">
        <div className="form-group">
          <Input
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            error={errors.name}
            disabled={mode === 'view'}
            required={mode !== 'view'}
            placeholder="Enter parameter set name"
          />
        </div>

        <div className="form-group">
          <Input
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            error={errors.description}
            disabled={mode === 'view'}
            multiline
            rows={3}
            placeholder="Enter optional description"
          />
        </div>

        <div className="form-section">
          <h3>Gravity</h3>
          <div className="form-row">
            <div className="form-group">
              <Input
                label="X-axis"
                name="gravity_x"
                type="number"
                value={formData.gravity_x}
                onChange={handleInputChange}
                error={errors.gravity_x}
                disabled={mode === 'view'}
                placeholder="0"
                step="0.01"
              />
            </div>
            <div className="form-group">
              <Input
                label="Y-axis"
                name="gravity_y"
                type="number"
                value={formData.gravity_y}
                onChange={handleInputChange}
                error={errors.gravity_y}
                disabled={mode === 'view'}
                placeholder="-9.81"
                step="0.01"
              />
            </div>
            <div className="form-group">
              <Input
                label="Z-axis"
                name="gravity_z"
                type="number"
                value={formData.gravity_z}
                onChange={handleInputChange}
                error={errors.gravity_z}
                disabled={mode === 'view'}
                placeholder="0"
                step="0.01"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Simulation Settings</h3>
          <div className="form-row">
            <div className="form-group">
              <Input
                label="Time Scale"
                name="time_scale"
                type="number"
                value={formData.time_scale}
                onChange={handleInputChange}
                error={errors.time_scale}
                disabled={mode === 'view'}
                placeholder="1.0"
                min="0.1"
                step="0.1"
              />
            </div>
            <div className="form-group">
              <Input
                label="Solver Iterations"
                name="solver_iterations"
                type="number"
                value={formData.solver_iterations}
                onChange={handleInputChange}
                error={errors.solver_iterations}
                disabled={mode === 'view'}
                placeholder="10"
                min="1"
                step="1"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Material Properties</h3>
          <div className="form-row">
            <div className="form-group">
              <Input
                label="Air Resistance"
                name="air_resistance"
                type="number"
                value={formData.air_resistance}
                onChange={handleInputChange}
                error={errors.air_resistance}
                disabled={mode === 'view'}
                placeholder="0.1"
                min="0"
                max="1"
                step="0.01"
              />
            </div>
            <div className="form-group">
              <Input
                label="Friction"
                name="friction"
                type="number"
                value={formData.friction}
                onChange={handleInputChange}
                error={errors.friction}
                disabled={mode === 'view'}
                placeholder="0.5"
                min="0"
                max="1"
                step="0.01"
              />
            </div>
            <div className="form-group">
              <Input
                label="Bounce Factor"
                name="bounce_factor"
                type="number"
                value={formData.bounce_factor}
                onChange={handleInputChange}
                error={errors.bounce_factor}
                disabled={mode === 'view'}
                placeholder="0.7"
                min="0"
                max="1"
                step="0.01"
              />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" loading={isSubmitting}>
            {isSubmitting
              ? mode === 'edit'
                ? 'Updating...'
                : 'Creating...'
              : mode === 'edit'
                ? 'Update'
                : 'Create'}
          </Button>
        </div>

        {submitError && <div className="error-message">{submitError}</div>}
        {submitSuccess && <div className="success-message">{submitSuccess}</div>}
      </form>
    );
  };

  return (
    <div className="physics-parameters-modal">
      <div className="modal-header">
        <h2 className="modal-title">
          <Icon name="physics" /> {getModalTitle()}
        </h2>
        <Button variant="icon" onClick={onClose} icon="close" disabled={isSubmitting} />
      </div>
      <div className="modal-content">{renderModalContent()}</div>
    </div>
  );
};

// Add PropTypes validation
PhysicsParametersModal.propTypes = {
  sceneId: PropTypes.string.isRequired,
  paramsId: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  mode: PropTypes.oneOf(['create', 'edit', 'view', 'delete']),
  initialData: PropTypes.object,
};

export default PhysicsParametersModal;
