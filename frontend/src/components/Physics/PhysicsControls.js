import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchPhysicsParameters,
  updatePhysicsParameters,
} from '../../redux/slices/physicsSlice';
import styles from './PhysicsControls.module.css';

const PhysicsControls = ({ universeId }) => {
  const dispatch = useDispatch();
  const { parameters, isLoading, error } = useSelector(state => state.physics);
  const [localParameters, setLocalParameters] = useState({
    gravity: 9.81,
    friction: 0.5,
    elasticity: 0.7,
    airResistance: 0.1,
    density: 1.0,
  });

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
    const updatedParameters = {
      ...localParameters,
      [name]: parseFloat(value),
    };
    setLocalParameters(updatedParameters);
    dispatch(
      updatePhysicsParameters({ universeId, parameters: updatedParameters })
    );
  };

  if (isLoading) {
    return <div className={styles.loading}>Loading physics parameters...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.physicsControls}>
      <h3>Physics Parameters</h3>

      <div className={styles.parameter}>
        <label htmlFor="gravity">Gravity</label>
        <input
          type="range"
          id="gravity"
          min="0"
          max="20"
          step="0.1"
          value={localParameters.gravity}
          onChange={e => handleParameterChange('gravity', e.target.value)}
        />
        <span>{localParameters.gravity}</span>
      </div>

      <div className={styles.parameter}>
        <label htmlFor="friction">Friction</label>
        <input
          type="range"
          id="friction"
          min="0"
          max="1"
          step="0.01"
          value={localParameters.friction}
          onChange={e => handleParameterChange('friction', e.target.value)}
        />
        <span>{localParameters.friction}</span>
      </div>

      <div className={styles.parameter}>
        <label htmlFor="elasticity">Elasticity</label>
        <input
          type="range"
          id="elasticity"
          min="0"
          max="1"
          step="0.01"
          value={localParameters.elasticity}
          onChange={e => handleParameterChange('elasticity', e.target.value)}
        />
        <span>{localParameters.elasticity}</span>
      </div>

      <div className={styles.parameter}>
        <label htmlFor="airResistance">Air Resistance</label>
        <input
          type="range"
          id="airResistance"
          min="0"
          max="1"
          step="0.01"
          value={localParameters.airResistance}
          onChange={e => handleParameterChange('airResistance', e.target.value)}
        />
        <span>{localParameters.airResistance}</span>
      </div>

      <div className={styles.parameter}>
        <label htmlFor="density">Density</label>
        <input
          type="range"
          id="density"
          min="0"
          max="5"
          step="0.1"
          value={localParameters.density}
          onChange={e => handleParameterChange('density', e.target.value)}
        />
        <span>{localParameters.density}</span>
      </div>
    </div>
  );
};

export default PhysicsControls;
