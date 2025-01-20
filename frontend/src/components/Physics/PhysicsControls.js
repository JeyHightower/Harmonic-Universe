import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchPhysicsParameters,
  setParameters,
  updateParameter,
} from '../../redux/slices/physicsSlice';
import './PhysicsControls.css';

const PARAMETER_DESCRIPTIONS = {
  gravity:
    'Controls the strength of gravitational force in the universe (m/s²)',
  friction:
    'Determines how much objects slow down when moving against surfaces',
  elasticity: 'Controls how bouncy objects are during collisions',
  airResistance: 'Affects how much air slows down moving objects',
  density: 'Controls the mass per unit volume of objects (kg/m³)',
  timeScale: 'Adjusts the speed of time in the simulation',
};

const PhysicsControls = ({ universeId }) => {
  const dispatch = useDispatch();
  const { parameters, status, error } = useSelector(state => state.physics);
  const [localParameters, setLocalParameters] = useState({
    gravity: 9.81,
    friction: 0.5,
    elasticity: 0.7,
    airResistance: 0.1,
    density: 1.0,
    timeScale: 1.0,
  });

  const [saveTimeout, setSaveTimeout] = useState(null);
  const [activeTooltip, setActiveTooltip] = useState(null);

  useEffect(() => {
    if (universeId) {
      dispatch(fetchPhysicsParameters(universeId));
    }
  }, [dispatch, universeId]);

  useEffect(() => {
    if (parameters) {
      setLocalParameters(parameters);
    }
  }, [parameters]);

  const handleParameterChange = (name, value) => {
    const numericValue = parseFloat(value);

    setLocalParameters(prev => ({
      ...prev,
      [name]: numericValue,
    }));

    dispatch(setParameters({ name, value: numericValue }));

    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    const newTimeout = setTimeout(() => {
      dispatch(
        updateParameter({
          universeId,
          parameters: {
            ...localParameters,
            [name]: numericValue,
          },
        })
      );
    }, 500);

    setSaveTimeout(newTimeout);
  };

  const renderParameter = (name, min, max, step) => (
    <div
      className="parameter"
      onMouseEnter={() => setActiveTooltip(name)}
      onMouseLeave={() => setActiveTooltip(null)}
    >
      <label htmlFor={name}>
        {name.charAt(0).toUpperCase() +
          name.slice(1).replace(/([A-Z])/g, ' $1')}
        {activeTooltip === name && (
          <div className="tooltip">{PARAMETER_DESCRIPTIONS[name]}</div>
        )}
      </label>
      <input
        type="range"
        id={name}
        min={min}
        max={max}
        step={step}
        value={localParameters[name]}
        onChange={e => handleParameterChange(name, e.target.value)}
      />
      <span>{localParameters[name].toFixed(2)}</span>
    </div>
  );

  if (status === 'loading' && !parameters) {
    return (
      <div className="loading-container">
        <div className="loading">Loading physics parameters...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error">
          <h4>Error loading physics parameters</h4>
          <p>{error}</p>
          <button
            onClick={() => dispatch(fetchPhysicsParameters(universeId))}
            className="retry-button"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="physics-controls">
      <h3>Physics Parameters</h3>
      {status === 'loading' && (
        <div className="saving-indicator">Saving changes...</div>
      )}

      {renderParameter('gravity', 0, 20, 0.1)}
      {renderParameter('friction', 0, 1, 0.01)}
      {renderParameter('elasticity', 0, 1, 0.01)}
      {renderParameter('air_resistance', 0, 1, 0.01)}
      {renderParameter('density', 0, 5, 0.1)}
      {renderParameter('time_scale', 0.1, 2, 0.1)}
    </div>
  );
};

export default PhysicsControls;
