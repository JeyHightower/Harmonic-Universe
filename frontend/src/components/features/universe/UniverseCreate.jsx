import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createUniverse } from '../../../store/thunks/universeThunks';
import {
  validateDescription,
  validateUniverseName,
} from '../../../utils/validation';
import Button from '../../common/Button';
import Input from '../../common/Input';
import './Universe.css';

function UniverseCreate({ isModal = false, onSuccess, onCancel }) {
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

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear error when user starts typing
    setFormErrors(prev => ({
      ...prev,
      [name]: '',
    }));
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

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await dispatch(createUniverse(formData)).unwrap();

      if (isModal && onSuccess) {
        onSuccess(result.id);
      } else {
        navigate(`/universes/${result.id}`);
      }
    } catch (error) {
      console.error('Failed to create universe:', error);
      setError(error.response?.data?.message || 'Failed to create universe');
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`universe-create ${isModal ? 'in-modal' : ''}`}>
      {!isModal && <h1>Create New Universe</h1>}
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
          <p className="help-text">
            Public universes can be viewed by other users
          </p>
        </div>

        <div className={`form-actions ${isModal ? 'modal-actions' : ''}`}>
          {isModal && (
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting} loading={isSubmitting}>
            Create Universe
          </Button>
        </div>
      </form>
    </div>
  );
}

export default UniverseCreate;
