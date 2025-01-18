import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import ErrorMessage from '../components/Common/ErrorMessage';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import PhysicsControls from '../components/Physics/PhysicsControls';
import PhysicsSimulation from '../components/Physics/PhysicsSimulation';
import {
  fetchPhysicsParameters,
  updatePhysicsParameters,
} from '../store/actions/physicsActions';
import './PhysicsParametersPage.css';

const PhysicsParametersPage = () => {
  const { universeId } = useParams();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const physicsParameters = useSelector(state => state.physics.parameters);
  const universe = useSelector(state => state.universes.currentUniverse);

  useEffect(() => {
    const loadParameters = async () => {
      try {
        await dispatch(fetchPhysicsParameters(universeId));
        setIsLoading(false);
      } catch (err) {
        setError('Failed to load physics parameters');
        setIsLoading(false);
      }
    };

    loadParameters();
  }, [dispatch, universeId]);

  const handleParameterChange = async (parameter, value) => {
    try {
      await dispatch(
        updatePhysicsParameters(universeId, { [parameter]: value })
      );
    } catch (err) {
      setError('Failed to update physics parameters');
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading physics parameters..." />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="physics-parameters-page">
      <header className="physics-parameters-header">
        <h1>{universe?.name} - Physics Parameters</h1>
        <p className="physics-description">
          The physics parameters control various aspects of your universe&apos;s
          behavior:
        </p>
      </header>

      <div className="physics-content">
        <div className="physics-simulation-container">
          <h2>Physics Simulation</h2>
          <PhysicsSimulation
            parameters={physicsParameters}
            universeId={universeId}
          />
        </div>

        <div className="physics-controls-container">
          <h2>Parameter Controls</h2>
          <PhysicsControls
            parameters={physicsParameters}
            onParameterChange={handleParameterChange}
          />
        </div>
      </div>

      <div className="physics-info">
        <h3>About Physics Parameters</h3>
        <p>
          The physics parameters control various aspects of your universe's
          behavior:
        </p>
        <ul>
          <li>
            <strong>Gravity:</strong> Controls the strength of gravitational
            forces
          </li>
          <li>
            <strong>Friction:</strong> Affects how objects slow down when moving
          </li>
          <li>
            <strong>Elasticity:</strong> Determines how bouncy collisions are
          </li>
          <li>
            <strong>Air Resistance:</strong> Controls how much objects are
            affected by air
          </li>
        </ul>
      </div>
    </div>
  );
};

export default PhysicsParametersPage;
