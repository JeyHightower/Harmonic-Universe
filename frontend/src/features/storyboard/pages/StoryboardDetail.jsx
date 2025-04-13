import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../../components/common/Button.jsx";
import Spinner from "../../../components/common/Spinner.jsx";
import { fetchUniverseById } from "../../../store/thunks/universeThunks.mjs";
import "../styles/Storyboard.css";
import apiClient from "../../../services/api.adapter";

const StoryboardDetail = () => {
  const { universeId, storyboardId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const canvasRef = useRef(null);

  const [storyboard, setStoryboard] = useState(null);
  const [storyPoints, setStoryPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [selectedPoint, setSelectedPoint] = useState(null);

  const universe = useSelector((state) => state.universe.currentUniverse);

  // Fetch universe if not already loaded
  useEffect(() => {
    if (!universe || universe.id !== universeId) {
      dispatch(fetchUniverseById(universeId));
    }
  }, [dispatch, universe, universeId]);

  // Fetch storyboard and its story points
  useEffect(() => {
    const fetchStoryboardData = async () => {
      try {
        setLoading(true);

        // Check if the API endpoints are available
        if (!apiClient.endpoints.storyboards) {
          console.error("Storyboard endpoints not available");
          setError(
            "Storyboard feature is not available yet. Please check back later."
          );
          setLoading(false);
          return;
        }

        // Fetch storyboard details
        const storyboardResponse = await apiClient.get(
          apiClient.endpoints.storyboards.get(universeId, storyboardId)
        );
        setStoryboard(storyboardResponse);

        // Fetch story points
        const pointsResponse = await apiClient.get(
          apiClient.endpoints.storyboards.points.list(universeId, storyboardId)
        );
        setStoryPoints(pointsResponse.story_points || []);

        setError(null);
      } catch (err) {
        console.error("Error fetching storyboard data:", err);

        // Handle 404 errors (endpoint not found)
        if (err.response && err.response.status === 404) {
          setError(
            "Storyboard feature is not available yet. Please check back later."
          );
        } else {
          setError("Failed to load storyboard. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStoryboardData();
  }, [universeId, storyboardId]);

  const handlePointClick = (point) => {
    setSelectedPoint(point);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.1, 0.5));
  };

  if (loading && !storyboard) {
    return (
      <div className="storyboard-editor loading">
        <Spinner size="large" />
        <p>Loading storyboard...</p>
      </div>
    );
  }

  return (
    <div className="storyboard-editor">
      <div className="storyboard-sidebar">
        <h2>{storyboard?.name || "Storyboard"}</h2>
        <p>{storyboard?.description || "No description"}</p>

        <div className="sidebar-actions">
          <Button
            onClick={() =>
              navigate(
                `/universes/${universeId}/storyboards/${storyboardId}/edit`
              )
            }
            variant="primary"
          >
            Edit Storyboard
          </Button>
          <Button
            onClick={() => navigate(`/universes/${universeId}/storyboards`)}
            variant="secondary"
          >
            Back to List
          </Button>
        </div>

        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        {selectedPoint && (
          <div className="point-details">
            <h3>{selectedPoint.title}</h3>
            <p>{selectedPoint.content || "No content"}</p>
          </div>
        )}
      </div>

      <div
        className="storyboard-canvas"
        ref={canvasRef}
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: "0 0",
        }}
      >
        {storyPoints.map((point) => (
          <div
            key={point.id}
            className={`story-point ${
              selectedPoint?.id === point.id ? "selected" : ""
            }`}
            style={{
              left: `${point.position_x}px`,
              top: `${point.position_y}px`,
            }}
            onClick={() => handlePointClick(point)}
          >
            <h4>{point.title}</h4>
          </div>
        ))}

        <div className="storyboard-toolbar">
          <Button onClick={handleZoomIn} variant="icon" title="Zoom In">
            +
          </Button>
          <Button onClick={handleZoomOut} variant="icon" title="Zoom Out">
            -
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StoryboardDetail;
