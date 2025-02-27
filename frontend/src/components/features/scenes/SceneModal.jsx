import React, { useEffect, useMemo, useState } from 'react';
import { api, endpoints } from '../../../utils/api';
import Button from '../../common/Button';
import Icon from '../../common/Icon';
import Input from '../../common/Input';
import Spinner from '../../common/Spinner';
import './Scenes.css';

const DEFAULT_SCENE = {
  name: '',
  description: '',
  universe_id: null,
};

const SceneModal = ({
  universeId,
  sceneId,
  onClose,
  onSuccess,
  mode = 'create', // 'create', 'edit', 'view', 'delete'
  initialData = null,
}) => {
  const [formData, setFormData] = useState({
    ...DEFAULT_SCENE,
    universe_id: universeId,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isViewMode = mode === 'view';
  const isDeleteMode = mode === 'delete';
  const isEditMode = mode === 'edit';
  const isCreateMode = mode === 'create';
  const isReadOnly = isViewMode || isDeleteMode;

  // Set modal title based on mode
  const modalTitle = useMemo(() => {
    switch (mode) {
      case 'create':
        return 'Create New Scene';
      case 'edit':
        return 'Edit Scene';
      case 'view':
        return 'Scene Details';
      case 'delete':
        return 'Delete Scene';
      default:
        return 'Scene';
    }
  }, [mode]);

  // Fetch scene data if editing or viewing
  useEffect(() => {
    const fetchSceneData = async () => {
      if (!sceneId || isCreateMode) return;

      setIsLoading(true);
      try {
        const sceneData = await api.get(
          `${endpoints.universes.detail(universeId)}/scenes/${sceneId}`
        );
        setFormData({
          ...formData,
          ...sceneData,
        });
      } catch (error) {
        console.error('Failed to fetch scene:', error);
        setErrors({ form: 'Failed to load scene data. Please try again.' });
      } finally {
        setIsLoading(false);
      }
    };

    if ((isEditMode || isViewMode || isDeleteMode) && sceneId) {
      fetchSceneData();
    }
  }, [sceneId, isEditMode, isViewMode, isDeleteMode, universeId]);

  // Initialize form data from props
  useEffect(() => {
    if (initialData) {
      setFormData({
        ...DEFAULT_SCENE,
        universe_id: universeId,
        ...initialData,
      });
    }
  }, [initialData, universeId]);

  const validateField = (name, value) => {
    if (name === 'name' && !value.trim()) {
      return 'Name is required';
    }
    if (name === 'name' && value.length > 100) {
      return 'Name must be less than 100 characters';
    }
    if (name === 'description' && value.length > 500) {
      return 'Description must be less than 500 characters';
    }
    return '';
  };

  const handleChange = (name, value) => {
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));

    // Validate the field
    const errorMessage = validateField(name, value);
    setErrors(prevErrors => ({
      ...prevErrors,
      [name]: errorMessage,
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Name must be less than 100 characters';
    }

    // Validate description (optional but with length limit)
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (isDeleteMode) {
      setIsSubmitting(true);
      try {
        await api.delete(
          `${endpoints.universes.detail(universeId)}/scenes/${sceneId}`
        );
        setShowSuccessMessage(true);
        setTimeout(() => {
          onSuccess?.('delete', { id: sceneId });
          onClose();
        }, 1500);
      } catch (error) {
        console.error('Failed to delete scene:', error);
        setErrors({
          form: error.response?.data?.message || 'Failed to delete scene',
        });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (isViewMode) {
      onClose();
      return;
    }

    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      let result;

      if (isCreateMode) {
        // Create new scene
        result = await api.post(
          `${endpoints.universes.detail(universeId)}/scenes`,
          {
            ...formData,
            universe_id: universeId,
          }
        );
      } else if (isEditMode) {
        // Update existing scene
        result = await api.put(
          `${endpoints.universes.detail(universeId)}/scenes/${sceneId}`,
          formData
        );
      }

      setShowSuccessMessage(true);
      setTimeout(() => {
        onSuccess?.(isCreateMode ? 'create' : 'update', result);
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Failed to save scene:', error);
      setErrors({
        form:
          error.response?.data?.message ||
          'An error occurred while saving the scene',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderModalContent = () => {
    if (isLoading) {
      return (
        <div className="loading-container">
          <Spinner size="large" />
          <p>Loading scene data...</p>
        </div>
      );
    }

    if (isDeleteMode) {
      return (
        <div className="delete-confirmation">
          <div className="warning-icon">
            <Icon name="warning" size="large" />
          </div>
          <p>
            Are you sure you want to delete <strong>{formData.name}</strong>?
            This action cannot be undone.
          </p>
          <p>All physics objects in this scene will be permanently deleted.</p>

          {errors.form && <div className="error-message">{errors.form}</div>}

          {showSuccessMessage && (
            <div className="success-message">
              <Icon name="check" size="small" />
              Scene deleted successfully!
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="form-container">
        {!isViewMode && (
          <div className="form-instructions">
            <p>
              {isCreateMode
                ? 'Enter the details for your new scene.'
                : 'Update the details of your scene.'}
            </p>
          </div>
        )}

        {errors.form && <div className="error-message">{errors.form}</div>}

        {showSuccessMessage && (
          <div className="success-message">
            <Icon name="check" size="small" />
            Scene {isCreateMode ? 'created' : 'updated'} successfully!
          </div>
        )}

        <div className="form-section">
          <div className="form-row">
            <div className="form-group">
              <Input
                label="Name"
                type="text"
                name="name"
                value={formData.name}
                onChange={e => handleChange('name', e.target.value)}
                error={errors.name}
                readOnly={isReadOnly}
                required
                placeholder="Enter a name for your scene"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <Input
                label="Description"
                type="textarea"
                name="description"
                value={formData.description || ''}
                onChange={e => handleChange('description', e.target.value)}
                error={errors.description}
                readOnly={isReadOnly}
                rows={4}
                placeholder="Describe what happens in this scene"
              />
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            {isReadOnly ? 'Close' : 'Cancel'}
          </Button>
          <Button
            variant={isDeleteMode ? 'danger' : 'primary'}
            onClick={handleSubmit}
            loading={isSubmitting}
            disabled={
              isSubmitting ||
              (mode !== 'view' &&
                mode !== 'delete' &&
                Object.values(errors).some(Boolean))
            }
          >
            {isSubmitting ? (
              <Spinner size="small" />
            ) : (
              <>
                {isDeleteMode && <Icon name="delete" size="small" />}
                {isCreateMode && 'Create'}
                {isEditMode && 'Update'}
                {isViewMode && 'Close'}
                {isDeleteMode && 'Delete'}
              </>
            )}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="scene-modal">
      <div className="modal-header">
        <h2 className="modal-title">
          <Icon
            name={isDeleteMode ? 'delete' : 'scene'}
            size="medium"
            className="modal-title-icon"
          />
          {modalTitle}
        </h2>
        {formData.name && !isCreateMode && (
          <div className="scene-name">{formData.name}</div>
        )}
      </div>
      <div className="modal-content">{renderModalContent()}</div>
    </div>
  );
};

export default SceneModal;
