import React, { useState } from "react";
import PropTypes from "prop-types";
import { Button, Typography, Space, Alert } from "antd";
import apiClient from "../../../../services/api";

const { Text, Title } = Typography;

/**
 * Component for confirming scene deletion
 */
const SceneDeleteConfirmation = ({ scene, onConfirm, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDelete = async () => {
    try {
      setLoading(true);
      setError(null);

      // Call API to delete the scene
      await apiClient.deleteScene(scene.id);

      // Call onConfirm callback with the deleted scene id
      if (onConfirm) {
        onConfirm({ id: scene.id });
      }
    } catch (error) {
      console.error("Error deleting scene:", error);
      setError("Failed to delete scene. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="scene-delete-confirmation">
      <Title level={4}>Delete Scene</Title>

      <Text>
        Are you sure you want to delete the scene{" "}
        <strong>{scene.name || scene.title}</strong>?
      </Text>

      <div className="warning-message">
        <Alert
          message="Warning"
          description="This action cannot be undone. All data associated with this scene will be permanently deleted."
          type="warning"
          showIcon
        />
      </div>

      {error && (
        <div className="error-message">
          <Alert message="Error" description={error} type="error" showIcon />
        </div>
      )}

      <div className="confirmation-actions">
        <Space>
          <Button onClick={onCancel}>Cancel</Button>
          <Button
            type="primary"
            danger
            onClick={handleDelete}
            loading={loading}
          >
            Delete Scene
          </Button>
        </Space>
      </div>
    </div>
  );
};

SceneDeleteConfirmation.propTypes = {
  scene: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string,
    title: PropTypes.string,
  }).isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default SceneDeleteConfirmation;
