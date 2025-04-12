import React from "react";
import PropTypes from "prop-types";
import { Typography, Descriptions, Button, Card, Tag } from "antd";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Paper, Grid, CircularProgress } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { formatDate } from "../../../utils";

const { Title, Paragraph, Text } = Typography;

/**
 * Component for viewing scene details
 */
const SceneViewer = ({ scene, onClose }) => {
  // Default image for scenes that don't have an image
  const defaultImage = "/images/default-scene.jpg";

  // Format the scene type for display
  const getSceneTypeDisplay = (type) => {
    if (!type) return "Default";

    // Convert camelCase or snake_case to Title Case with spaces
    return type
      .replace(/_/g, " ")
      .replace(/([A-Z])/g, " $1")
      .replace(/^\w/, (c) => c.toUpperCase());
  };

  // Determine scene type color
  const getSceneTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case "introduction":
        return "blue";
      case "transition":
        return "orange";
      case "climax":
        return "red";
      case "resolution":
        return "green";
      default:
        return "default";
    }
  };

  return (
    <div className="scene-viewer">
      <Card
        className="scene-card-detail"
        cover={
          <img
            alt={scene.name || scene.title}
            src={scene.image_url || defaultImage}
            className="scene-image"
            onError={(e) => {
              e.target.src = defaultImage;
            }}
          />
        }
      >
        <Title level={3}>{scene.name || scene.title}</Title>

        {scene.scene_type && (
          <Tag color={getSceneTypeColor(scene.scene_type)}>
            {getSceneTypeDisplay(scene.scene_type)}
          </Tag>
        )}

        <div className="scene-description">
          <Title level={5}>Description</Title>
          <Paragraph>
            {scene.description || "No description provided."}
          </Paragraph>
        </div>

        <Descriptions title="Scene Details" bordered column={1}>
          <Descriptions.Item label="ID">{scene.id}</Descriptions.Item>

          {scene.order !== undefined && (
            <Descriptions.Item label="Order">{scene.order}</Descriptions.Item>
          )}

          {scene.created_at && (
            <Descriptions.Item label="Created At">
              {formatDate(scene.created_at)}
            </Descriptions.Item>
          )}

          {scene.updated_at && (
            <Descriptions.Item label="Last Updated">
              {formatDate(scene.updated_at)}
            </Descriptions.Item>
          )}

          {scene.universe_id && (
            <Descriptions.Item label="Universe ID">
              {scene.universe_id}
            </Descriptions.Item>
          )}
        </Descriptions>

        <div className="viewer-actions">
          <Button type="primary" onClick={onClose}>
            Close
          </Button>
        </div>
      </Card>
    </div>
  );
};

SceneViewer.propTypes = {
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
    universe_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }).isRequired,
  onClose: PropTypes.func.isRequired,
};

export default SceneViewer;
