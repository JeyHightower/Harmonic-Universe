import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import { createUniverse, updateUniverse } from '../store/universeThunks';
import '../styles/UniverseFormModal.css';

const UniverseFormModal = ({ isOpen, onClose, onSuccess, initialData }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector(state => state.universe);
  const isEditing = !!initialData;
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    theme: '',
    genre: '',
    is_public: false
  });

  // Form validation
  const [errors, setErrors] = useState({});

  // Initialize form with data if editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        image_url: initialData.image_url || '',
        theme: initialData.theme || '',
        genre: initialData.genre || '',
        is_public: initialData.is_public || false
      });
    }
  }, [initialData]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Name must be at least 3 characters';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    if (formData.image_url && !isValidUrl(formData.image_url)) {
      newErrors.image_url = 'Please enter a valid URL';
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

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Run validation before submission
    if (!validateForm()) {
      console.log('UniverseFormModal - Form validation failed');
      return; // Stop submission if validation fails
    }

    setIsSubmitting(true);
    console.log('UniverseFormModal - Submitting form...', formData);

    try {
      let result;
      if (isEditing) {
        // Update existing universe
        console.log('UniverseFormModal - Updating universe:', initialData.id);
        result = await dispatch(updateUniverse({
          id: initialData.id,
          ...formData
        })).unwrap();
      } else {
        // Create new universe
        console.log('UniverseFormModal - Creating new universe');
        result = await dispatch(createUniverse(formData)).unwrap();
      }

      console.log('UniverseFormModal - API call successful:', result);

      if (onSuccess) {
        // Extract the universe data - handle different possible response formats
        let universeData;

        if (result && typeof result === 'object') {
          // Try different possible structures
          if (result.universe && typeof result.universe === 'object') {
            // Case: { universe: {...} }
            universeData = result.universe;
          } else if (result.data && result.data.universe) {
            // Case: { data: { universe: {...} } }
            universeData = result.data.universe;
          } else if (result.id) {
            // Case: The result itself is the universe object
            universeData = result;
          } else {
            // Fallback
            console.warn('UniverseFormModal - Unexpected response format:', result);
            universeData = result;
          }
        } else {
          // Unexpected non-object response
          console.warn('UniverseFormModal - Unexpected non-object response:', result);
          universeData = result;
        }

        console.log('UniverseFormModal - Calling onSuccess with extracted data:', universeData);
        onSuccess(universeData);
      }
    } catch (err) {
      console.error('UniverseFormModal - Failed to save universe:', err);
      // Set form-wide error message
      setErrors(prev => ({
        ...prev,
        form: err.message || 'Failed to save universe. Please try again.'
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Universe' : 'Create Universe'}
      className="universe-form-modal"
    >
      <form onSubmit={handleSubmit} className="universe-form">
        <Input
          label="Universe Name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
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

        <Input
          label="Image URL"
          name="image_url"
          type="url"
          value={formData.image_url}
          onChange={handleChange}
          error={errors.image_url}
        />

        <div className="form-row">
          <Input
            label="Theme"
            name="theme"
            type="text"
            value={formData.theme}
            onChange={handleChange}
          />

          <Input
            label="Genre"
            name="genre"
            type="text"
            value={formData.genre}
            onChange={handleChange}
          />
        </div>

        <div className="checkbox-field">
          <input
            id="is_public"
            name="is_public"
            type="checkbox"
            checked={formData.is_public}
            onChange={handleChange}
          />
          <label htmlFor="is_public">Make universe public</label>
        </div>

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

UniverseFormModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  initialData: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    description: PropTypes.string,
    image_url: PropTypes.string,
    theme: PropTypes.string,
    genre: PropTypes.string,
    is_public: PropTypes.bool
  })
};

export default UniverseFormModal;
