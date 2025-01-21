import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createUniverse } from '../../store/slices/universeSlice';

const UniverseCreate = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: false,
    maxParticipants: 10,
  });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await dispatch(createUniverse(formData)).unwrap();
      navigate(`/universe/${result.id}`);
    } catch (err) {
      setError(err.message || 'Failed to create universe');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="create-universe-container">
      <h2>Create New Universe</h2>
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="universe-form">
        <div className="form-group">
          <label htmlFor="name">Universe Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            minLength={3}
            maxLength={50}
            placeholder="Enter universe name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            placeholder="Describe your universe"
          />
        </div>

        <div className="form-group">
          <label htmlFor="maxParticipants">Max Participants</label>
          <input
            type="number"
            id="maxParticipants"
            name="maxParticipants"
            value={formData.maxParticipants}
            onChange={handleChange}
            min={1}
            max={100}
          />
        </div>

        <div className="form-group checkbox">
          <label>
            <input
              type="checkbox"
              name="isPublic"
              checked={formData.isPublic}
              onChange={handleChange}
            />
            Make Universe Public
          </label>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/universes')}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button type="submit" disabled={isLoading} className="btn-primary">
            {isLoading ? 'Creating...' : 'Create Universe'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UniverseCreate;
