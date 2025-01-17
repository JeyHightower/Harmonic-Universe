import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { createUniverse } from '../../redux/slices/universeSlice';

const UniverseForm = ({ onClose }) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    gravity_constant: 9.81,
    environment_harmony: 0.5,
  });

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const result = await dispatch(createUniverse(formData));
    if (createUniverse.fulfilled.match(result)) {
      onClose();
    }
  };

  return (
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
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="gravity_constant">Gravity Constant</label>
        <input
          type="number"
          id="gravity_constant"
          name="gravity_constant"
          value={formData.gravity_constant}
          onChange={handleChange}
          step="0.01"
          min="0"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="environment_harmony">Environment Harmony</label>
        <input
          type="range"
          id="environment_harmony"
          name="environment_harmony"
          value={formData.environment_harmony}
          onChange={handleChange}
          min="0"
          max="1"
          step="0.01"
          required
        />
        <span>{formData.environment_harmony}</span>
      </div>

      <div className="form-actions">
        <button type="submit">Create Universe</button>
        <button type="button" onClick={onClose}>
          Cancel
        </button>
      </div>
    </form>
  );
};

export default UniverseForm;
