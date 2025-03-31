import PropTypes from "prop-types";
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/SceneCard.css";
import { formatDate } from "../../utils/dateUtils";

/**
 * SceneCard component displays a card representation of a scene
 * Used throughout the application for scene listings and universe details
 */
const SceneCard = ({ scene, onEdit, onDelete }) => {
  const defaultImage = "/images/default-scene.jpg";
  const navigate = useNavigate();

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
      onEdit(scene);
      return;
    }

    // Make sure we have a valid universe_id
    if (!scene.universe_id) {
      console.error(
        "SceneCard - Cannot navigate to scene edit: missing universe_id"
      );
      return;
    }

    // Navigate to the scene edit page with the correct path format
    const universeId = scene.universe_id;
    navigate(`/universes/${universeId}/scenes/${scene.id}/edit`);
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

  const cardContent = (
    <>
      <div className="scene-card-image">
        <img
          src={scene.image_url || defaultImage}
          alt={scene.title || scene.name}
          onError={(e) => {
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
            alt={scene.title || scene.name}
            onError={(e) => {
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
