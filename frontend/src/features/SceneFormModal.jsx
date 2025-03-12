import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { createScene, updateScene } from '../store/scenesThunks.js';
import Modal from '../components/Modal.jsx';
import Button from '../components/Button';
import Input from '../components/Input';
import '../styles/SceneFormModal.css';

const SceneFormModal = ({ isOpen, onClose, onSuccess, initialData, universeId }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector(state => state.scenes);
  const isEditing = !!initialData;
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    universe_id: universeId || '',
    scene_type: 'standard',
    is_active: true,
    duration: 60
  });

  // Form validation
  const [errors, setErrors] = useState({});

  // Scene types
  const sceneTypes = [
    { value: 'standard', label: 'Standard' },
    { value: 'cinematic', label: 'Cinematic' },
    { value: 'action', label: 'Action' },
    { value: 'dialogue', label: 'Dialogue' },
    { value: 'montage', label: 'Montage' }
  ];

  // Initialize form with data if editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        universe_id: initialData.universe_id || universeId,
        scene_type: initialData.scene_type || 'standard',
        is_active: initialData.is_active !== false,
        duration: initialData.duration || 60
      });
    } else if (universeId) {
      setFormData(prev => ({
        ...prev,
        universe_id: universeId
      }));
    }
  }, [initialData, universeId]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    if (!formData.universe_id) {
      newErrors.universe_id = 'Universe ID is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear field-specific error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Run validation before submission
    if (!validateForm()) {
      console.log('SceneFormModal - Form validation failed');
      return; // Stop submission if validation fails
    }

    setIsSubmitting(true);
    console.log('SceneFormModal - Submitting form...', formData);

    try {
      let result;
      if (isEditing) {
        // Update existing scene
        console.log('SceneFormModal - Updating scene:', initialData.id);
        result = await dispatch(updateScene({
          id: initialData.id,
          ...formData
        })).unwrap();
      } else {
        // Create new scene
        console.log('SceneFormModal - Creating new scene');
        result = await dispatch(createScene(formData)).unwrap();
      }

      console.log('SceneFormModal - API call successful:', result);

      if (onSuccess) {
        // Extract the scene data - handle different possible response formats
        let sceneData;

        if (result && typeof result === 'object') {
          // Try different possible structures
          if (result.status === 'success' && result.data && result.data.scene) {
            // Simple backend format: { status: 'success', data: { scene: {...} } }
            sceneData = result.data.scene;
          } else if (result.scene && typeof result.scene === 'object') {
            // Case: { scene: {...} }
            sceneData = result.scene;
          } else if (result.data && result.data.scene) {
            // Case: { data: { scene: {...} } }
            sceneData = result.data.scene;
          } else if (result.id) {
            // Case: The result itself is the scene object
            sceneData = result;
          } else {
            // Fallback
            console.warn('SceneFormModal - Unexpected response format:', result);
            sceneData = result;
          }
        } else {
          // Unexpected non-object response
          console.warn('SceneFormModal - Unexpected non-object response:', result);
          sceneData = result;
        }

        console.log('SceneFormModal - Calling onSuccess with extracted data:', sceneData);
        onSuccess(sceneData);
      }
    } catch (err) {
      console.error('SceneFormModal - Failed to save scene:', err);
      // Set form-wide error message
      setErrors(prev => ({
        ...prev,
        form: err.message || 'Failed to save scene. Please try again.'
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Scene' : 'Create Scene'}
    >
      <form onSubmit={handleSubmit} className="scene-form">
        <Input
          label="Scene Title"
          name="title"
          type="text"
          value={formData.title}
          onChange={handleChange}
          error={errors.title}
          required
        />

        <Input
          label="Description"
          name="description"
          type="textarea"
          value={formData.description}
          onChange={handleChange}
          error={errors.description}
          rows={4}
        />

        <div className="form-row">
          <div className="select-field">
            <label htmlFor="scene_type">Scene Type</label>
            <select
              id="scene_type"
              name="scene_type"
              value={formData.scene_type}
              onChange={handleChange}
            >
              {sceneTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Duration (seconds)"
            name="duration"
            type="number"
            value={formData.duration}
            onChange={handleChange}
            min={1}
            max={3600}
          />
        </div>

        <div className="checkbox-field">
          <input
            id="is_active"
            name="is_active"
            type="checkbox"
            checked={formData.is_active}
            onChange={handleChange}
          />
          <label htmlFor="is_active">Active scene</label>
        </div>

        {/* Hidden field for universe_id */}
        <input
          type="hidden"
          name="universe_id"
          value={formData.universe_id}
        />

        {error && <div className="form-error">{error}</div>}
        {errors.form && <div className="form-error">{errors.form}</div>}

        <div className="form-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

SceneFormModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  initialData: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string,
    description: PropTypes.string,
    universe_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    scene_type: PropTypes.string,
    is_active: PropTypes.bool,
    duration: PropTypes.number
  }),
  universeId: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number
  ])
};

export default SceneFormModal;
