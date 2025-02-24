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

function UniverseCreate() {
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
      navigate(`/universes/${result.id}`);
    } catch (error) {
      console.error('Failed to create universe:', error);
      setError(error.response?.data?.message || 'Failed to create universe');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="universe-create">
      <h1>Create New Universe</h1>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <Input
          type="text"
          label="Universe Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          error={formErrors.name}
          required
        />
        <Input
          type="textarea"
          label="Description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          error={formErrors.description}
          required
        />
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              name="is_public"
              checked={formData.is_public}
              onChange={handleChange}
            />
            Make Universe Public
          </label>
        </div>
        <Button type="submit" disabled={isSubmitting} loading={isSubmitting}>
          Create Universe
        </Button>
      </form>
    </div>
  );
}

export default UniverseCreate;
