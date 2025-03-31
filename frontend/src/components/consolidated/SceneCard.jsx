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

  const handleEdit = (e) => {
    // Stop the event from bubbling up
    console.log("SceneCard - Edit button clicked for scene:", scene.id);

    // Prevent any default behavior or bubbling from the event
    e.preventDefault();
    e.stopPropagation();

    console.log("SceneCard - Edit handler - event prevented");
    console.log("SceneCard - Navigating to edit page for scene:", scene.id);

    // Navigate to the edit page for this scene
    navigate(`/universes/${scene.universe_id}/scenes/${scene.id}/edit`);
  };

  const handleDelete = (e) => {
    console.log("SceneCard - Delete button clicked for scene:", scene.id);

    // Prevent any default behavior or bubbling from the event
    e.preventDefault();
    e.stopPropagation();

    if (onDelete) {
      console.log(
        "SceneCard - Calling provided onDelete function with scene:",
        scene.id
      );
      onDelete(scene);
    }
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
      <Link
        to={`/universes/${scene.universe_id}/scenes/${scene.id}`}
        className="scene-card"
      >
        {cardContent}
      </Link>
      <div className="scene-card-actions">
        <Link
          to={`/universes/${scene.universe_id}/scenes/${scene.id}/edit`}
          className="btn-edit"
          title="Edit Scene"
        >
          Edit
        </Link>
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
