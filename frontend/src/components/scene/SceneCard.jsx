import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from "@mui/icons-material";
import { formatDate } from "../../utils/dateUtils";
import "../../styles/SceneCard.css";

const SceneCard = ({ scene, onDelete, isOwner }) => {
  const defaultImage = "/images/default-scene.jpg";

  return (
    <Card className="scene-card">
      <div className="scene-card-image">
        <img
          src={scene.image_url || defaultImage}
          alt={scene.name}
          onError={(e) => {
            e.target.src = defaultImage;
          }}
        />
      </div>
      <CardContent className="scene-card-content">
        <Typography variant="h6" component="h2" className="scene-card-title">
          {scene.name}
        </Typography>
        <Typography
          variant="body2"
          color="textSecondary"
          className="scene-card-description"
        >
          {scene.description
            ? scene.description.length > 100
              ? `${scene.description.substring(0, 100)}...`
              : scene.description
            : "No description provided"}
        </Typography>
        <div className="scene-card-meta">
          <Typography variant="caption" color="textSecondary">
            Created: {formatDate(scene.created_at)}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            Last Updated: {formatDate(scene.updated_at)}
          </Typography>
        </div>
      </CardContent>
      <CardActions className="scene-card-actions">
        <Tooltip title="View Scene">
          <IconButton
            component={Link}
            to={`/scenes/${scene.id}`}
            color="primary"
            size="small"
          >
            <ViewIcon />
          </IconButton>
        </Tooltip>
        {isOwner && (
          <>
            <Tooltip title="Edit Scene">
              <IconButton
                component={Link}
                to={`/scenes/${scene.id}/edit`}
                color="primary"
                size="small"
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Scene">
              <IconButton
                onClick={() => onDelete(scene.id)}
                color="error"
                size="small"
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </>
        )}
      </CardActions>
    </Card>
  );
};

SceneCard.propTypes = {
  scene: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    image_url: PropTypes.string,
    created_at: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    updated_at: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }).isRequired,
  onDelete: PropTypes.func.isRequired,
  isOwner: PropTypes.bool.isRequired,
};

export default SceneCard;
