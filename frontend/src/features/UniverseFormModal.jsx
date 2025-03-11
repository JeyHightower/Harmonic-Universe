import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { createUniverse, updateUniverse } from '../../store/thunks/universeThunks';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import './UniverseFormModal.css';

const UniverseFormModal = ({ isOpen, onClose, onSuccess, initialData }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector(state => state.universe);
  const isEditing = !!initialData;

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      let result;

      if (isEditing) {
        // Update existing universe
        result = await dispatch(updateUniverse({
          id: initialData.id,
          ...formData
        })).unwrap();
      } else {
        // Create new universe
        result = await dispatch(createUniverse(formData)).unwrap();
      }

      if (onSuccess) {
        onSuccess(result.data.universe);
      }
    } catch (err) {
      console.error('Failed to save universe:', err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Universe' : 'Create Universe'}
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

UniverseFormModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  initialData: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string,
    description: PropTypes.string,
    image_url: PropTypes.string,
    theme: PropTypes.string,
    genre: PropTypes.string,
    is_public: PropTypes.bool
  })
};

export default UniverseFormModal;
