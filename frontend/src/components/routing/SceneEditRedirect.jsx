import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import apiClient from "../../services/api.adapter";
import { SceneModal } from "../../features/scene";

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

        const response = await apiClient.getScene(sceneId);
        const sceneData = response.data?.scene || response.data;

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
  }, [sceneId]);

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
