// UniverseBuilderPage.js
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { createUniverse } from '../redux/actions/universeActions';
import PhysicsControls from '../components/PhysicsControls';
import MusicControls from '../components/MusicControls';

const UniverseBuilderPage = () => {
  const dispatch = useDispatch();
  const [universeData, setUniverseData] = useState({
    name: '',
    description: '',
    gravity: 9.8,
    harmony: 1.0,
    physics_parameters: [],
    music_parameters: []
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(createUniverse(universeData));
  };

  return (
    <div className="universe-builder">
      <h1>Create New Universe</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Universe Name"
          value={universeData.name}
          onChange={(e) => setUniverseData({...universeData, name: e.target.value})}
        />
        <textarea
          placeholder="Description"
          value={universeData.description}
          onChange={(e) => setUniverseData({...universeData, description: e.target.value})}
        />
        <PhysicsControls
          onChange={(physics) => setUniverseData({...universeData, physics_parameters: physics})}
        />
        <MusicControls
          onChange={(music) => setUniverseData({...universeData, music_parameters: music})}
        />
        <button type="submit">Create Universe</button>
      </form>
    </div>
  );
};

export default UniverseBuilderPage;
