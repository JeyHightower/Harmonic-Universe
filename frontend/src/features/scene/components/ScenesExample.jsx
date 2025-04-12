import React, { useEffect, useState } from "react";
import { Button, Card, List, Typography, Space, message } from "antd";
import useSceneModal from "../../../hooks/useSceneModal";
import apiClient from "../../../services/api.adapter";
import SceneCardSimple from "./SceneCardSimple";

const { Title } = Typography;

/**
 * Example component demonstrating how to use the scene modal system
 * Edit functionality has been moved to direct URL navigation
 */
const ScenesExample = ({ universeId }) => {
  const [scenes, setScenes] = useState([]);
  const [loading, setLoading] = useState(false);

  // Use our custom hook - now only for create and delete operations
  const {
    isOpen,
    modalType,
    modalData,
    openCreateModal,
    openDeleteModal,
    closeModal,
    handleSuccess,
  } = useSceneModal();

  // Fetch scenes for the universe
  const fetchScenes = async () => {
    if (!universeId) {
      console.error(
        "ScenesExample - Cannot fetch scenes: universeId is missing"
      );
      return;
    }

    try {
      console.log("ScenesExample - Fetching scenes for universe:", universeId);
      setLoading(true);
      const response = await apiClient.getScenes(universeId);
      const sceneData = response.data?.scenes || response.data || [];
      console.log("ScenesExample - Fetched scenes:", sceneData.length);
      setScenes(sceneData);
    } catch (error) {
      console.error("ScenesExample - Error fetching scenes:", error);
      message.error("Failed to load scenes");
    } finally {
      setLoading(false);
    }
  };

  // Load scenes when component mounts
  useEffect(() => {
    if (universeId) {
      console.log(
        "ScenesExample - Component mounted with universeId:",
        universeId
      );
      fetchScenes();
    }
  }, [universeId]);

  // Handle scene creation success
  const handleCreateSuccess = (newScene) => {
    console.log("ScenesExample - Scene created successfully:", newScene);
    setScenes((prevScenes) => [...prevScenes, newScene]);
    message.success("Scene created successfully!");
  };

  // Handle scene deletion success
  const handleDeleteSuccess = ({ id }) => {
    console.log("ScenesExample - Scene deleted successfully:", id);
    setScenes((prevScenes) => prevScenes.filter((scene) => scene.id !== id));
    message.success("Scene deleted successfully!");
  };

  // Handle delete button click
  const handleDeleteClick = (scene) => {
    console.log("ScenesExample - Delete button clicked for scene:", scene.id);
    openDeleteModal(scene, handleDeleteSuccess);
  };

  return (
    <div className="scenes-example">
      <Card>
        <div
          className="scenes-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "16px",
          }}
        >
          <Title level={3}>Scenes for Universe {universeId}</Title>
          <Button
            type="primary"
            onClick={() => {
              console.log(
                "ScenesExample - Create button clicked for universe:",
                universeId
              );
              openCreateModal(universeId, handleCreateSuccess);
            }}
          >
            Create New Scene
          </Button>
        </div>

        <List
          loading={loading}
          dataSource={scenes}
          renderItem={(scene) => (
            <List.Item>
              <SceneCardSimple scene={scene} onDelete={handleDeleteClick} />
            </List.Item>
          )}
          locale={{ emptyText: "No scenes found. Create your first scene!" }}
        />
      </Card>

      {/* The modal handler - only renders when isOpen is true */}
      {isOpen && (
        <SceneModalHandler
          isOpen={isOpen}
          onClose={closeModal}
          mode={modalType}
          universeId={modalData.universeId}
          sceneId={modalData.sceneId}
          initialData={modalData.initialData}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};

export default ScenesExample;
