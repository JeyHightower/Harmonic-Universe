import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  fetchUniverse,
  updateUniverse,
} from '../../store/slices/universeSlice';

const UniverseEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const universe = useSelector(state => state.universe.currentUniverse);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: false,
    maxParticipants: 10,
  });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadUniverse = async () => {
      try {
        await dispatch(fetchUniverse(id)).unwrap();
      } catch (err) {
        setError('Failed to load universe');
        console.error('Error loading universe:', err);
      }
    };
    loadUniverse();
  }, [dispatch, id]);

  useEffect(() => {
    if (universe) {
      setFormData({
        name: universe.name || '',
        description: universe.description || '',
        isPublic: universe.isPublic || false,
        maxParticipants: universe.maxParticipants || 10,
      });
    }
  }, [universe]);

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
      await dispatch(updateUniverse({ id, ...formData })).unwrap();
      navigate(`/universe/${id}`);
    } catch (err) {
      setError(err.message || 'Failed to update universe');
    } finally {
      setIsLoading(false);
    }
  };

  if (!universe) {
    return <div>Loading...</div>;
  }

  return (
    <div className="edit-universe-container">
      <h2>Edit Universe</h2>
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
            onClick={() => navigate(`/universe/${id}`)}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button type="submit" disabled={isLoading} className="btn-primary">
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UniverseEdit;
