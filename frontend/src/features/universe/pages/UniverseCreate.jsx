import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/common/Button.jsx';
import Input from '../../../components/common/Input.jsx';
import { createUniverse } from '../../../store/thunks/universeThunks';
import '../styles/Universe.css';
function UniverseCreate({ onClose, onSuccess }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_public: false,
  });
  const [formErrors, setFormErrors] = useState({
    name: '',
    description: '',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear error when user starts typing
    setFormErrors((prev) => ({
      ...prev,
      [name]: '',
    }));
  };

  const validateUniverseName = (name) => {
    if (!name.trim()) return 'Universe name is required';
    if (name.length < 3) return 'Universe name must be at least 3 characters';
    if (name.length > 50) return 'Universe name must be less than 50 characters';
    return '';
  };

  const validateDescription = (description) => {
    if (!description.trim()) return 'Description is required';
    if (description.length < 10) return 'Description must be at least 10 characters';
    if (description.length > 500) return 'Description must be less than 500 characters';
    return '';
  };

  const validateForm = () => {
    const nameError = validateUniverseName(formData.name);
    const descriptionError = validateDescription(formData.description);

    setFormErrors({
      name: nameError,
      description: descriptionError,
    });

    return !nameError && !descriptionError;
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Universe create form submitted');

    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    console.log('Form validation passed, submitting universe data:', formData);
    setIsSubmitting(true);
    setError(null);

    try {
      console.log('Dispatching createUniverse action with data:', formData);
      const result = await dispatch(createUniverse(formData)).unwrap();
      console.log('Universe created successfully:', result);

      if (onSuccess) {
        console.log('Calling onSuccess callback with id:', result.id);
        onSuccess(result.id);
      } else {
        console.log('Navigating to universe detail page:', result.id);
        navigate(`/universes/${result.id}`);
      }

      if (onClose) {
        console.log('Calling onClose callback');
        onClose();
      }
    } catch (error) {
      console.error('Failed to create universe:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data,
      });
      setError(error.response?.data?.message || 'Failed to create universe');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="universe-create">
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit} className="universe-form">
        <Input
          type="text"
          label="Universe Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          error={formErrors.name}
          placeholder="Enter a unique name for your universe"
          required
        />
        <Input
          type="textarea"
          label="Description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          error={formErrors.description}
          placeholder="Describe your universe and its unique properties"
          required
        />
        <div className="form-group checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="is_public"
              checked={formData.is_public}
              onChange={handleChange}
              className="checkbox-input"
            />
            <span className="checkbox-text">Make Universe Public</span>
          </label>
          <p className="help-text">Public universes can be viewed by other users</p>
        </div>

        <div className="form-actions">
          <Button onClick={handleCancel} variant="secondary" disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" disabled={isSubmitting} loading={isSubmitting}>
            Create Universe
          </Button>
        </div>
      </form>
    </div>
  );
}

export default UniverseCreate;
