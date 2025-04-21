import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { SceneModal } from "../../features/scene/index.mjs";

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

  // Fetch the scene data when the component mounts
  useEffect(() => {
    const fetchSceneData = async () => {
      try {
        console.log(
          "SceneEditRedirect - Fetching scene data for scene ID:",
          sceneId
        );
        setLoading(true);

        // Import and use Redux thunk instead of direct API call
        const { fetchSceneById } = await import("../../store/thunks/consolidated/scenesThunks");

        // Dispatch the action to fetch scene data
        const resultAction = await dispatch(fetchSceneById(sceneId));

        // Check if the action was fulfilled or rejected
        if (fetchSceneById.fulfilled.match(resultAction)) {
          // Successfully fetched scene data
          const sceneData = resultAction.payload.scene || resultAction.payload;

          console.log("SceneEditRedirect - Scene data fetched:", sceneData);
          setScene(sceneData);

          // Extract universe ID from scene data
          if (sceneData && sceneData.universe_id) {
            setUniverseId(sceneData.universe_id);
          } else {
            setError("Could not determine universe ID for this scene");
          }

          // Show the edit modal
          setShowModal(true);
        } else {
          // Handle rejection - check for 404 error specifically
          const errorMessage = resultAction.error?.message || "Failed to load scene data";

          if (errorMessage.includes("404") || errorMessage.includes("not found")) {
            console.error("SceneEditRedirect - Scene not found:", sceneId);
            setError(`Scene with ID ${sceneId} not found. It may have been deleted or doesn't exist.`);
          } else {
            console.error("SceneEditRedirect - Error fetching scene:", errorMessage);
            setError("Failed to load scene data. Please try again.");
          }
        }
      } catch (error) {
        console.error("SceneEditRedirect - Error fetching scene:", error);
        setError("Failed to load scene data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (sceneId) {
      fetchSceneData();
    } else {
      setError("No scene ID provided");
      setLoading(false);
    }
  }, [sceneId, dispatch]);

  // Handle successful edit
  const handleEditSuccess = () => {
    console.log("SceneEditRedirect - Edit successful");
    if (universeId) {
      // Navigate to the proper scene detail page
      navigate(`/universes/${universeId}/scenes/${sceneId}`);
    } else {
      // If we couldn't determine the universe ID, go to dashboard
      navigate("/dashboard");
    }
  };

  // Handle modal close
  const handleClose = () => {
    console.log("SceneEditRedirect - Modal closed");
    if (universeId) {
      // Navigate to the scene detail page
      navigate(`/universes/${universeId}/scenes/${sceneId}`);
    } else {
      // If we couldn't determine the universe ID, go to dashboard
      navigate("/dashboard");
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
        <button onClick={() => navigate("/dashboard")}>Go to Dashboard</button>
      </div>
    );
  }

  // Render the scene edit modal if scene data is available
  return (
    <div>
      {showModal && scene && universeId && (
        <SceneModal
          isOpen={showModal}
          onClose={handleClose}
          onSuccess={handleEditSuccess}
          initialData={scene}
          universeId={universeId}
          mode="edit"
          sceneId={sceneId}
        />
      )}
    </div>
  );
};

export default SceneEditRedirect;
