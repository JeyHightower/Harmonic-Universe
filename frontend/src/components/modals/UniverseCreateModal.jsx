import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { createUniverse } from '../../store/thunks/universeThunks';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import './UniverseCreateModal.css';

const UniverseCreateModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_public: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await dispatch(createUniverse(formData)).unwrap();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create universe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Universe">
      <form onSubmit={handleSubmit} className="universe-create-form">
        {error && <div className="error-message">{error}</div>}

        <div className="form-group">
          <label htmlFor="name">Name</label>
          <Input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Enter universe name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <Input
            type="textarea"
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter universe description"
          />
        </div>

        <div className="form-group checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="is_public"
              checked={formData.is_public}
              onChange={handleChange}
            />
            Make this universe public
          </label>
        </div>

        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Universe'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default UniverseCreateModal;
