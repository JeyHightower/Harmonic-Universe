import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import AudioVisualizer from "../../components/Audio/AudioVisualizer";
import FrequencyAnalyzer from "../../components/Audio/FrequencyAnalyzer";
import ErrorMessage from "../../components/Common/ErrorMessage";
import LoadingSpinner from "../../components/Common/LoadingSpinner";
import PhysicsSimulation from "../../components/Physics/PhysicsSimulation";
import { fetchUniverse } from "../../store/actions/universeActions";
import "./UniversePage.css";

const UniversePage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const universe = useSelector((state) => state.universe.currentUniverse);
  const isPlaying = useSelector((state) => state.audio.isPlaying);

  useEffect(() => {
    const loadUniverse = async () => {
      try {
        setLoading(true);
        await dispatch(fetchUniverse(id)).unwrap();
      } catch (err) {
        setError(err.message || "Failed to load universe");
      } finally {
        setLoading(false);
      }
    };

    loadUniverse();
  }, [dispatch, id]);

  if (loading) {
    return <LoadingSpinner overlay text="Loading Universe..." />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!universe) {
    return <ErrorMessage message="Universe not found" />;
  }

  return (
    <div className="universe-page">
      <header className="universe-header">
        <h1>{universe.name}</h1>
        <p className="universe-description">{universe.description}</p>
      </header>

      <div className="universe-content">
        <div className="visualization-section">
          <h2>Audio Visualization</h2>
          <AudioVisualizer />
          <FrequencyAnalyzer />
        </div>

        <div className="simulation-section">
          <h2>Physics Simulation</h2>
          <PhysicsSimulation
            parameters={universe.physics_parameters}
            isPlaying={isPlaying}
          />
        </div>

        <div className="parameters-section">
          <div className="physics-parameters">
            <h3>Physics Parameters</h3>
            <ul>
              <li>
                <strong>Gravity:</strong> {universe.physics_parameters.gravity}
              </li>
              <li>
                <strong>Friction:</strong>{" "}
                {universe.physics_parameters.friction}
              </li>
              <li>
                <strong>Elasticity:</strong>{" "}
                {universe.physics_parameters.elasticity}
              </li>
              <li>
                <strong>Air Resistance:</strong>{" "}
                {universe.physics_parameters.airResistance}
              </li>
            </ul>
          </div>

          <div className="music-parameters">
            <h3>Music Parameters</h3>
            <ul>
              <li>
                <strong>Harmony:</strong> {universe.music_parameters.harmony}
              </li>
              <li>
                <strong>Tempo:</strong> {universe.music_parameters.tempo} BPM
              </li>
              <li>
                <strong>Key:</strong> {universe.music_parameters.key}
              </li>
              <li>
                <strong>Scale:</strong> {universe.music_parameters.scale}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UniversePage;
