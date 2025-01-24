import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createUniverse } from '../../store/actions/universeActions';

const UniverseCreator = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const universe = await dispatch(createUniverse({ name, description }));
      navigate(`/universe/${universe.id}`);
    } catch (error) {
      console.error('Failed to create universe:', error);
    }
  };

  return (
    <div className="universe-creator">
      <h2>Create New Universe</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Universe Name</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            required
          />
        </div>
        <button type="submit">Create Universe</button>
      </form>
    </div>
  );
};

export default UniverseCreator;
