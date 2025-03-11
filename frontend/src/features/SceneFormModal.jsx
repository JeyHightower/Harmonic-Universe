import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { createScene, updateScene } from '../../store/thunks/scenesThunks';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import './SceneFormModal.css';

const SceneFormModal = ({ isOpen, onClose, onSuccess, initialData, universeId }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector(state => state.scenes);
  const isEditing = !!initialData;

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    scene_type: 'standard',
    is_active: true,
    universe_id: universeId || (initialData ? initialData.universe_id : '')
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
        image_url: initialData.image_url || '',
        scene_type: initialData.scene_type || 'standard',
        is_active: initialData.is_active !== false,
        universe_id: initialData.universe_id
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

    if (formData.image_url && !isValidUrl(formData.image_url)) {
      newErrors.image_url = 'Please enter a valid URL';
    }

    if (!formData.universe_id) {
      newErrors.universe_id = 'Universe ID is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      let result;

      if (isEditing) {
        // Update existing scene
        result = await dispatch(updateScene({
          id: initialData.id,
          ...formData
        })).unwrap();
      } else {
        // Create new scene
        result = await dispatch(createScene(formData)).unwrap();
      }

      if (onSuccess) {
        onSuccess(result.data.scene);
      }
    } catch (err) {
      console.error('Failed to save scene:', err);
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
          rows={3}
        />

        <Input
          label="Image URL"
          name="image_url"
          type="url"
          value={formData.image_url}
          onChange={handleChange}
          error={errors.image_url}
        />

        <div className="form-row select-field">
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

        <div className="checkbox-field">
          <input
            id="is_active"
            name="is_active"
            type="checkbox"
            checked={formData.is_active}
            onChange={handleChange}
          />
          <label htmlFor="is_active">Active Scene</label>
        </div>

        {error && <div className="form-error">{error}</div>}

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
            disabled={loading}
          >
            {loading ? 'Saving...' : isEditing ? 'Update' : 'Create'}
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
  universeId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  initialData: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string,
    description: PropTypes.string,
    image_url: PropTypes.string,
    scene_type: PropTypes.string,
    is_active: PropTypes.bool,
    universe_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
  })
};

export default SceneFormModal;
