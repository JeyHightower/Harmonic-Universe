import PropTypes from "prop-types";
import React from "react";
import { Link } from "react-router-dom";
import "../styles/SceneCardSimple.css";
import { formatDate } from "../../../utils";

const SceneCardSimple = ({ scene, onEdit, onDelete }) => {
  const defaultImage = "/images/default-scene.jpg";

  return (
    <div className="scene-card-simple">
      <div className="scene-card-header">
        <h3>{scene.title || scene.name}</h3>
      </div>
      <div className="scene-card-info">
        <p>{scene.description || "No description provided"}</p>
        <div className="scene-meta">
          <span>Created: {formatDate(scene.created_at)}</span>
        </div>
      </div>
      <div className="scene-card-buttons">
        <Link to={`/scenes/${scene.id}`} className="view-button">
          View
        </Link>
        <button
          className="edit-button"
          onClick={() => onEdit && onEdit(scene)}
          style={{
            padding: "10px 20px",
            backgroundColor: "#4285f4",
            color: "white",
            border: "none",
            borderRadius: "4px",
            margin: "5px",
            cursor: "pointer",
            fontSize: "16px",
          }}
        >
          Edit Scene
        </button>
        <button
          className="delete-button"
          onClick={() => onDelete && onDelete(scene)}
          style={{
            padding: "10px 20px",
            backgroundColor: "#ea4335",
            color: "white",
            border: "none",
            borderRadius: "4px",
            margin: "5px",
            cursor: "pointer",
            fontSize: "16px",
          }}
        >
          Delete Scene
        </button>
      </div>
    </div>
  );
};

SceneCardSimple.propTypes = {
  scene: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string,
    image_url: PropTypes.string,
    created_at: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }).isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
};

export default SceneCardSimple; 