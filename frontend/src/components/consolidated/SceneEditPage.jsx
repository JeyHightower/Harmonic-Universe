import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Typography, message, Spin, Breadcrumb, Alert } from "antd";
import {
  HomeOutlined,
  ReadOutlined,
  EditOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import SceneForm from "./SceneForm";
import apiClient from "../../services/api";
import "../../styles/SceneEditPage.css";

const { Title } = Typography;

/**
 * SceneEditPage component for editing scenes on a dedicated page
 * This replaces the modal approach with a full page edit experience
 */
const SceneEditPage = () => {
  const { universeId, sceneId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [scene, setScene] = useState(null);
  const [universeName, setUniverseName] = useState("");
  const [error, setError] = useState(null);

  console.log("SceneEditPage - Component rendering with params:", {
    universeId,
    sceneId,
  });

  // Fetch the scene data when the component mounts
  useEffect(() => {
    const fetchSceneData = async () => {
      try {
        console.log(
          `SceneEditPage - Fetching scene ${sceneId} from universe ${universeId}`
        );
        setLoading(true);
        setError(null);

        const response = await apiClient.getScene(sceneId);
        const sceneData = response.data?.scene || response.data;

        console.log("SceneEditPage - Scene data fetched:", sceneData);
        setScene(sceneData);

        // Get universe name if available
        if (sceneData?.universe?.name) {
          setUniverseName(sceneData.universe.name);
        } else if (universeId) {
          try {
            const universeResponse = await apiClient.getUniverse(universeId);
            const universeData =
              universeResponse.data?.universe || universeResponse.data;
            if (universeData?.name) {
              setUniverseName(universeData.name);
            }
          } catch (error) {
            console.error("SceneEditPage - Error fetching universe:", error);
          }
        }
      } catch (error) {
        console.error("SceneEditPage - Error fetching scene:", error);
        setError(
          "Failed to load scene data. Please refresh the page and try again."
        );
        message.error("Failed to load scene. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (sceneId) {
      fetchSceneData();
    } else {
      setLoading(false);
      setError("No scene ID provided. Cannot edit without a scene ID.");
    }
  }, [sceneId, universeId]);

  // Handle form submission (save changes)
  const handleSubmit = async (updatedScene) => {
    try {
      console.log("SceneEditPage - Saving scene changes:", updatedScene);
      setLoading(true);
      setError(null);

      // Make sure we have a universe_id
      if (!updatedScene.universe_id && universeId) {
        console.log(
          "SceneEditPage - Adding universeId to scene data:",
          universeId
        );
        updatedScene.universe_id = universeId;
      }

      const response = await apiClient.updateScene(sceneId, updatedScene);
      const result = response.data?.scene || response.data;

      console.log("SceneEditPage - Scene updated successfully:", result);
      message.success("Scene updated successfully!");

      // Navigate back to the scene details page
      navigate(`/universes/${universeId}/scenes/${sceneId}`);
    } catch (error) {
      console.error("SceneEditPage - Error updating scene:", error);
      setError(
        `Failed to update scene: ${
          error.message || "An unknown error occurred"
        }`
      );
      message.error("Failed to update scene. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel action
  const handleCancel = () => {
    console.log("SceneEditPage - Edit canceled");
    // Navigate back to the scene details page
    navigate(`/universes/${universeId}/scenes/${sceneId}`);
  };

  return (
    <div className="scene-edit-page">
      <Breadcrumb className="scene-breadcrumbs">
        <Breadcrumb.Item href="/">
          <HomeOutlined /> Home
        </Breadcrumb.Item>
        <Breadcrumb.Item href={`/universes/${universeId}`}>
          {universeName || `Universe ${universeId}`}
        </Breadcrumb.Item>
        <Breadcrumb.Item href={`/universes/${universeId}/scenes/${sceneId}`}>
          <ReadOutlined /> {scene?.name || "Scene Details"}
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <EditOutlined /> Edit Scene
        </Breadcrumb.Item>
      </Breadcrumb>

      <div className="scene-edit-header">
        <Title level={2}>
          {scene?.name ? `Edit "${scene.name}"` : "Edit Scene"}
        </Title>
      </div>

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: "24px" }}
          closable
        />
      )}

      {loading && !scene ? (
        <Card className="loading-card">
          <div className="loading-container">
            <Spin size="large" />
            <p>Loading scene data...</p>
          </div>
        </Card>
      ) : scene ? (
        <SceneForm
          universeId={universeId}
          sceneId={sceneId}
          initialData={scene}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      ) : (
        !loading && (
          <Card className="error-card">
            <div className="error-container">
              <p>
                Scene not found. The scene may have been deleted or you don't
                have permission to view it.
              </p>
              <button onClick={() => navigate(`/universes/${universeId}`)}>
                Return to Universe
              </button>
            </div>
          </Card>
        )
      )}
    </div>
  );
};

export default SceneEditPage;
