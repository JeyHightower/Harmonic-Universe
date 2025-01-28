import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchPhysicsParameters,
  setParameter,
  updatePhysicsParameters,
} from '../../redux/slices/physicsSlice';
import './PhysicsControlPanel.css';

const PhysicsControlPanel = ({ universeId }) => {
  const dispatch = useDispatch();
  const { parameters, status, error } = useSelector(state => state.physics);

  useEffect(() => {
    dispatch(fetchPhysicsParameters(universeId));
  }, [dispatch, universeId]);

  const handleParameterChange = (paramName, value) => {
    dispatch(setParameter({ name: paramName, value }));
    dispatch(
      updatePhysicsParameters({
        universeId,
        parameters: { ...parameters, [paramName]: value },
      })
    );
  };

  if (status === 'loading') {
    return <div className="physics-control-panel loading">Loading...</div>;
  }

  if (status === 'failed') {
    return <div className="physics-control-panel error">Error: {error}</div>;
  }

  return (
    <div className="physics-control-panel">
      <h2>Physics Controls</h2>
      <div className="control-section">
        <div className="parameter-group">
          <h3>Basic Parameters</h3>
          <div className="parameter">
            <label>Gravity</label>
            <input
              type="range"
              min="0"
              max="20"
              step="0.1"
              value={parameters.gravity}
              onChange={e =>
                handleParameterChange('gravity', parseFloat(e.target.value))
              }
            />
            <span>{parameters.gravity.toFixed(2)} m/s²</span>
          </div>
          <div className="parameter">
            <label>Air Resistance</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={parameters.airResistance}
              onChange={e =>
                handleParameterChange(
                  'airResistance',
                  parseFloat(e.target.value)
                )
              }
            />
            <span>{parameters.airResistance.toFixed(2)}</span>
          </div>
          <div className="parameter">
            <label>Friction</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={parameters.friction}
              onChange={e =>
                handleParameterChange('friction', parseFloat(e.target.value))
              }
            />
            <span>{parameters.friction.toFixed(2)}</span>
          </div>
        </div>

        <div className="parameter-group">
          <h3>Particle Properties</h3>
          <div className="parameter">
            <label>Elasticity</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={parameters.elasticity}
              onChange={e =>
                handleParameterChange('elasticity', parseFloat(e.target.value))
              }
            />
            <span>{parameters.elasticity.toFixed(2)}</span>
          </div>
          <div className="parameter">
            <label>Particle Size</label>
            <input
              type="range"
              min="1"
              max="20"
              step="1"
              value={parameters.particleSize}
              onChange={e =>
                handleParameterChange('particleSize', parseInt(e.target.value))
              }
            />
            <span>{parameters.particleSize}px</span>
          </div>
          <div className="parameter">
            <label>Max Particles</label>
            <input
              type="range"
              min="100"
              max="5000"
              step="100"
              value={parameters.maxParticles}
              onChange={e =>
                handleParameterChange('maxParticles', parseInt(e.target.value))
              }
            />
            <span>{parameters.maxParticles}</span>
          </div>
        </div>

        <div className="parameter-group">
          <h3>Simulation Control</h3>
          <div className="parameter">
            <label>Time Scale</label>
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.1"
              value={parameters.timeScale}
              onChange={e =>
                handleParameterChange('timeScale', parseFloat(e.target.value))
              }
            />
            <span>{parameters.timeScale.toFixed(1)}x</span>
          </div>
          <div className="parameter">
            <label>Particle Lifetime (ms)</label>
            <input
              type="range"
              min="1000"
              max="10000"
              step="100"
              value={parameters.particleLifetime}
              onChange={e =>
                handleParameterChange(
                  'particleLifetime',
                  parseInt(e.target.value)
                )
              }
            />
            <span>{parameters.particleLifetime}ms</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhysicsControlPanel;
