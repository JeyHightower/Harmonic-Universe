import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import ErrorMessage from '../../components/Common/ErrorMessage';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import {
  fetchStoryboard,
  updateStoryboard,
} from '../../store/actions/storyboardActions';
import './StoryboardPage.css';

const StoryboardPage = () => {
  const { universeId, storyboardId } = useParams();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeScene, setActiveScene] = useState(null);

  const storyboard = useSelector(state => state.storyboards.currentStoryboard);
  const universe = useSelector(state => state.universes.currentUniverse);

  useEffect(() => {
    const loadStoryboard = async () => {
      try {
        await dispatch(fetchStoryboard(universeId, storyboardId));
        setIsLoading(false);
      } catch (err) {
        setError('Failed to load storyboard');
        setIsLoading(false);
      }
    };

    loadStoryboard();
  }, [dispatch, universeId, storyboardId]);

  const handleSceneUpdate = async (sceneId, updates) => {
    try {
      await dispatch(
        updateStoryboard(universeId, storyboardId, {
          scenes: storyboard.scenes.map(scene =>
            scene.id === sceneId ? { ...scene, ...updates } : scene
          ),
        })
      );
    } catch (err) {
      setError('Failed to update scene');
    }
  };

  const handleSceneSelect = scene => {
    setActiveScene(scene);
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading storyboard..." />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="storyboard-page">
      <header className="storyboard-header">
        <h1>{storyboard?.title || 'Untitled Storyboard'}</h1>
        <p className="storyboard-universe">Universe: {universe?.name}</p>
      </header>

      <div className="storyboard-content">
        <div className="scenes-list">
          <h2>Scenes</h2>
          <div className="scenes-grid">
            {storyboard?.scenes.map(scene => (
              <div
                key={scene.id}
                className={`scene-card ${
                  activeScene?.id === scene.id ? 'active' : ''
                }`}
                onClick={() => handleSceneSelect(scene)}
              >
                <div className="scene-preview">
                  {scene.thumbnail ? (
                    <img src={scene.thumbnail} alt={`Scene ${scene.order}`} />
                  ) : (
                    <div className="scene-placeholder">Scene {scene.order}</div>
                  )}
                </div>
                <div className="scene-info">
                  <span className="scene-number">Scene {scene.order}</span>
                  <p className="scene-description">{scene.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {activeScene && (
          <div className="scene-editor">
            <h2>Scene Editor</h2>
            <div className="scene-details">
              <div className="scene-preview-large">
                {activeScene.thumbnail ? (
                  <img
                    src={activeScene.thumbnail}
                    alt={`Scene ${activeScene.order}`}
                  />
                ) : (
                  <div className="scene-placeholder-large">
                    Scene {activeScene.order}
                  </div>
                )}
              </div>

              <div className="scene-controls">
                <div className="control-group">
                  <label>Description</label>
                  <textarea
                    value={activeScene.description}
                    onChange={e =>
                      handleSceneUpdate(activeScene.id, {
                        description: e.target.value,
                      })
                    }
                    placeholder="Enter scene description..."
                  />
                </div>

                <div className="control-group">
                  <label>Duration (seconds)</label>
                  <input
                    type="number"
                    value={activeScene.duration}
                    onChange={e =>
                      handleSceneUpdate(activeScene.id, {
                        duration: parseFloat(e.target.value),
                      })
                    }
                    min="0"
                    step="0.1"
                  />
                </div>

                <div className="control-group">
                  <label>Music Parameters</label>
                  <div className="parameter-controls">
                    <div className="parameter">
                      <label>Tempo</label>
                      <input
                        type="range"
                        min="60"
                        max="180"
                        value={activeScene.musicParameters?.tempo || 120}
                        onChange={e =>
                          handleSceneUpdate(activeScene.id, {
                            musicParameters: {
                              ...activeScene.musicParameters,
                              tempo: parseInt(e.target.value),
                            },
                          })
                        }
                      />
                      <span>
                        {activeScene.musicParameters?.tempo || 120} BPM
                      </span>
                    </div>

                    <div className="parameter">
                      <label>Intensity</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={activeScene.musicParameters?.intensity || 50}
                        onChange={e =>
                          handleSceneUpdate(activeScene.id, {
                            musicParameters: {
                              ...activeScene.musicParameters,
                              intensity: parseInt(e.target.value),
                            },
                          })
                        }
                      />
                      <span>
                        {activeScene.musicParameters?.intensity || 50}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryboardPage;
