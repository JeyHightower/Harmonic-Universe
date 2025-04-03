import PropTypes from "prop-types";
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/SceneCard.css";
import { formatDate } from "../../utils/dateUtils";
// Import a local default image to avoid server requests
import localDefaultImage from "../../assets/images/default-scene.svg";

/**
 * SceneCard component displays a card representation of a scene
 * Used throughout the application for scene listings and universe details
 */
const SceneCard = ({ scene, onEdit, onDelete, isOwner = false }) => {
  const navigate = useNavigate();

  // Use the local image first, fall back to the remote one only if necessary
  const defaultImage = localDefaultImage || "/images/default-scene.svg";

  const handleView = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Make sure we have a valid universe_id
    if (!scene.universe_id) {
      console.error(
        "SceneCard - Cannot navigate to scene view: missing universe_id"
      );
      return;
    }

    // Navigate to the scene detail page
    const universeId = scene.universe_id;
    navigate(`/universes/${universeId}/scenes/${scene.id}`);
  };

  const handleEdit = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if we have a custom edit handler
    if (onEdit) {
      console.log("SceneCard - Using provided onEdit handler");
      onEdit(scene);
      return;
    }

    // If no custom handler is provided, navigate to the simplified direct edit route
    console.log(
      `SceneCard - No onEdit handler provided, navigating to direct scene edit route for scene ID: ${scene.id}`
    );

    // Use the direct scene edit route which doesn't require universe_id in the URL
    // This will use our SceneEditRedirect component which handles fetching all necessary data
    const editPath = `/scenes/${scene.id}/edit`;
    console.log(`SceneCard - Navigating to simplified route: ${editPath}`);

    // Use navigate function to go to the edit route
    navigate(editPath, { replace: true });
  };

  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (onDelete) {
      onDelete(scene);
    }
  };

  // Create a click handler for the entire card that navigates to the scene detail page
  const handleCardClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleView(e);
  };

  // Add a better fallback for date formatting
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      return date.toLocaleDateString();
    } catch (error) {
      console.warn("Error formatting date:", error);
      return "N/A";
    }
  };

  const cardContent = (
    <>
      <div className="scene-card-image">
        <img
          src={scene.image_url || defaultImage}
          alt={scene.title || scene.name || "Scene"}
          onError={(e) => {
            console.log("Image failed to load, using default image");
            // Use a local fallback instead of remote one if possible
            e.target.onerror = null; // Prevent infinite error loop
            e.target.src = defaultImage;
          }}
        />
        {scene.scene_type && (
          <div className="scene-type-badge">{scene.scene_type}</div>
        )}
      </div>
      <div className="scene-card-content">
        <h3 className="scene-card-title">{scene.title || scene.name}</h3>
        <p className="scene-card-description">
          {scene.description
            ? scene.description.length > 100
              ? `${scene.description.substring(0, 100)}...`
              : scene.description
            : "No description provided"}
        </p>
        <div className="scene-card-meta">
          <span className="scene-card-date">
            Created: {formatDate(scene.created_at)}
          </span>
          {scene.updated_at && (
            <span className="scene-card-date">
              Updated: {formatDate(scene.updated_at)}
            </span>
          )}
          {scene.order !== undefined && (
            <span className="scene-card-order">Order: {scene.order}</span>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div className="scene-card-container">
      <div className="scene-card" onClick={handleCardClick}>
        <div className="scene-card-image">
          <img
            src={scene.image_url || defaultImage}
            alt={scene.title || scene.name || "Scene"}
            onError={(e) => {
              console.log("Image failed to load, using default image");
              // Use a local fallback instead of remote one if possible
              e.target.onerror = null; // Prevent infinite error loop
              e.target.src = defaultImage;
            }}
          />
          {scene.scene_type && (
            <div className="scene-type-badge">{scene.scene_type}</div>
          )}
        </div>
        <div className="scene-card-content">
          <h3 className="scene-card-title">{scene.title || scene.name}</h3>
          <p className="scene-card-description">
            {scene.description
              ? scene.description.length > 100
                ? `${scene.description.substring(0, 100)}...`
                : scene.description
              : "No description provided"}
          </p>
          <div className="scene-card-meta">
            <span className="scene-card-date">
              Created: {formatDate(scene.created_at)}
            </span>
            {scene.updated_at && (
              <span className="scene-card-date">
                Updated: {formatDate(scene.updated_at)}
              </span>
            )}
            {scene.order !== undefined && (
              <span className="scene-card-order">Order: {scene.order}</span>
            )}
          </div>
        </div>
      </div>
      <div className="scene-card-actions">
        <button
          className="btn-view"
          onClick={handleView}
          title="View Scene"
          type="button"
        >
          View
        </button>
        <button
          className="btn-edit"
          onClick={handleEdit}
          title="Edit Scene"
          type="button"
        >
          Edit
        </button>
        {onDelete && (
          <button
            className="btn-delete"
            onClick={handleDelete}
            title="Delete Scene"
            type="button"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
};

SceneCard.propTypes = {
  scene: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string,
    image_url: PropTypes.string,
    scene_type: PropTypes.string,
    order: PropTypes.number,
    created_at: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    updated_at: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    universe_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
      .isRequired,
  }).isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
};

export default SceneCard;
