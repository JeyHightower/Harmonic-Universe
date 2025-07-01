import { lazy, Suspense, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
const SceneModal = lazy(() => import('../../features/scene/modals/SceneModal'));

/**
 * SceneEditRedirect - Handles direct URLs to /scenes/:sceneId/edit
 * Fetches the scene data and universe information, then shows the edit modal
 */
const SceneEditRedirect = () => {
  const { sceneId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [scene, setScene] = useState(null);
  const [universeId, setUniverseId] = useState(null);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Get the current scene from Redux store if available
  const currentSceneFromStore = useSelector((state) => state.scenes?.currentScene);
  const allScenes = useSelector((state) => state.scenes?.scenes || []);

  // Fetch the scene data when the component mounts
  useEffect(() => {
    const fetchSceneData = async () => {
      try {
        console.log('SceneEditRedirect - Fetching scene data for scene ID:', sceneId);
        setLoading(true);

        // Check if we already have this scene in Redux store
        if (currentSceneFromStore && currentSceneFromStore.id === sceneId) {
          console.log('SceneEditRedirect - Using scene from Redux store:', currentSceneFromStore);
          setScene(currentSceneFromStore);

          if (currentSceneFromStore.universe_id) {
            setUniverseId(currentSceneFromStore.universe_id);
          } else {
            setError('Could not determine universe ID for this scene');
          }

          setShowModal(true);
          setLoading(false);
          return;
        }

        // Check if we already have this scene in the scenes list
        const existingScene = allScenes.find((s) => s.id === sceneId);
        if (existingScene) {
          console.log('SceneEditRedirect - Using scene from scenes list:', existingScene);
          setScene(existingScene);

          if (existingScene.universe_id) {
            setUniverseId(existingScene.universe_id);
          } else {
            setError('Could not determine universe ID for this scene');
          }

          setShowModal(true);
          setLoading(false);
          return;
        }

        // Import and use Redux thunk instead of direct API call
        const { fetchSceneById } = await import(
          /* @vite-ignore */ '../../store/thunks/consolidated/scenesThunks'
        );

        // Dispatch the action to fetch scene data
        const resultAction = await dispatch(fetchSceneById(sceneId));

        // Check if the action was fulfilled or rejected
        if (fetchSceneById.fulfilled.match(resultAction)) {
          // Successfully fetched scene data
          const sceneData = resultAction.payload.scene || resultAction.payload;

          console.log('SceneEditRedirect - Scene data fetched:', sceneData);
          setScene(sceneData);

          // Extract universe ID from scene data
          if (sceneData && sceneData.universe_id) {
            setUniverseId(sceneData.universe_id);
          } else {
            setError('Could not determine universe ID for this scene');
          }

          // Show the edit modal
          setShowModal(true);
        } else {
          // Handle rejection - check for 404 error specifically
          const errorMessage = resultAction.error?.message || 'Failed to load scene data';

          if (errorMessage.includes('404') || errorMessage.includes('not found')) {
            console.error('SceneEditRedirect - Scene not found:', sceneId);
            setError(
              `Scene with ID ${sceneId} not found. It may have been deleted or doesn't exist.`
            );
          } else {
            console.error('SceneEditRedirect - Error fetching scene:', errorMessage);
            setError('Failed to load scene data. Please try again.');
          }
        }
      } catch (error) {
        console.error('SceneEditRedirect - Error fetching scene:', error);
        setError('Failed to load scene data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (sceneId) {
      fetchSceneData();
    } else {
      setError('No scene ID provided');
      setLoading(false);
    }
  }, [sceneId, dispatch, currentSceneFromStore, allScenes]);

  // Handle successful edit
  const handleEditSuccess = () => {
    console.log('SceneEditRedirect - Edit successful');
    if (universeId) {
      // Navigate to the proper scene detail page
      navigate(`/universes/${universeId}/scenes/${sceneId}`);
    } else {
      // If we couldn't determine the universe ID, go to dashboard
      navigate('/dashboard');
    }
  };

  // Handle modal close
  const handleClose = () => {
    console.log('SceneEditRedirect - Modal closed');
    if (universeId) {
      // Navigate to the scene detail page
      navigate(`/universes/${universeId}/scenes/${sceneId}`);
    } else {
      // If we couldn't determine the universe ID, go to dashboard
      navigate('/dashboard');
    }
  };

  // Show loading state while fetching data
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading scene data...</p>
      </div>
    );
  }

  // Show error if something went wrong
  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
      </div>
    );
  }

  // Render the scene edit modal if scene data is available
  return (
    <div>
      {showModal && scene && universeId && (
        <Suspense fallback={<div>Loading Scene Modal...</div>}>
          <SceneModal
            isOpen={showModal}
            onClose={handleClose}
            onSuccess={handleEditSuccess}
            initialData={scene}
            universeId={universeId}
            mode="edit"
            sceneId={sceneId}
          />
        </Suspense>
      )}
    </div>
  );
};

export default SceneEditRedirect;
