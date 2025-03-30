import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useModal } from "../../contexts/ModalContext";
import { api } from "../../utils/api";
import { API_CONFIG, MODAL_TYPES } from "../../utils/config";
import Button from "../common/Button";
import Icon from "../common/Icon";
import Spinner from "../common/Spinner";
import PhysicsObjectsManager from "../physics/PhysicsObjectsManager";
import PhysicsParametersManager from "../physics/PhysicsParametersManager";
import "./Scenes.css";

const SceneManager = () => {
  const { id: universeId } = useParams();
  const { openModalByType } = useModal();
  const [scenes, setScenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSceneId, setActiveSceneId] = useState(null);
  const [activeTab, setActiveTab] = useState("objects");

  // Fetch scenes when component mounts or universeId changes
  useEffect(() => {
    fetchScenes();
  }, [universeId]);

  // Fetch scenes for the current universe
  const fetchScenes = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/scenes/?universe_id=${universeId}`
      );
      setScenes(response || []);

      // Set active scene to the first one if available
      if (response.length > 0 && !activeSceneId) {
        setActiveSceneId(response[0].id);
      }

      setError(null);
    } catch (err) {
      console.error("Failed to fetch scenes:", err);
      setError("Failed to load scenes. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Handle tab change (scene selection)
  const handleTabChange = (sceneId) => {
    setActiveSceneId(sceneId);
  };

  // Open modal for creating a new scene
  const handleAddScene = () => {
    openModalByType(MODAL_TYPES.SCENE_CREATE, {
      universeId,
      onSuccess: (data) => {
        // Add the new scene to the list
        setScenes([...scenes, data]);
        setActiveSceneId(data.id);
      },
    });
  };

  // Open modal for viewing a scene
  const handleViewScene = (scene) => {
    openModalByType(MODAL_TYPES.SCENE_EDIT, {
      universeId,
      sceneId: scene.id,
      initialData: scene,
      readOnly: true,
    });
  };

  // Open modal for editing a scene
  const handleEditScene = (scene) => {
    openModalByType(MODAL_TYPES.SCENE_EDIT, {
      universeId,
      sceneId: scene.id,
      initialData: scene,
      onSuccess: (data) => {
        // Update the scene in the list
        setScenes(
          scenes.map((s) => (s.id === data.id ? { ...s, ...data } : s))
        );
      },
    });
  };

  // Open modal for deleting a scene
  const handleDeleteScene = (scene) => {
    openModalByType(MODAL_TYPES.CONFIRM_DELETE, {
      entityType: "scene",
      entityId: scene.id,
      entityName: scene.name,
      onConfirm: () => {
        // Remove the deleted scene from the list
        setScenes(scenes.filter((s) => s.id !== scene.id));

        // If the active scene was deleted, set the first available scene as active
        if (activeSceneId === scene.id) {
          const remainingScenes = scenes.filter((s) => s.id !== scene.id);
          if (remainingScenes.length > 0) {
            setActiveSceneId(remainingScenes[0].id);
          } else {
            setActiveSceneId(null);
          }
        }
      },
    });
  };

  // Render scenes as tabs
  const renderSceneTabs = () => {
    if (loading) {
      return (
        <div className="loading-container">
          <Spinner size="large" />
          <p>Loading scenes...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="error-container">
          <Icon name="error" size="large" />
          <p>{error}</p>
          <Button variant="secondary" onClick={fetchScenes}>
            <Icon name="refresh" size="small" />
            Try Again
          </Button>
        </div>
      );
    }

    if (scenes.length === 0) {
      return (
        <div className="empty-container">
          <Icon name="scene" size="large" />
          <p>No scenes found</p>
          <Button variant="primary" onClick={handleAddScene}>
            <Icon name="plus" size="small" />
            Create New Scene
          </Button>
        </div>
      );
    }

    return (
      <div className="scenes-tabs">
        <div className="tab-headers">
          {scenes.map((scene) => (
            <div
              key={scene.id}
              className={`tab-header ${
                activeSceneId === scene.id ? "active" : ""
              }`}
              onClick={() => handleTabChange(scene.id)}
            >
              <span className="tab-header-name">{scene.name}</span>
              <div className="tab-header-actions">
                <button
                  className="action-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewScene(scene);
                  }}
                >
                  <Icon name="eye" size="small" />
                </button>
                <button
                  className="action-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditScene(scene);
                  }}
                >
                  <Icon name="edit" size="small" />
                </button>
                <button
                  className="action-button danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteScene(scene);
                  }}
                >
                  <Icon name="delete" size="small" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {scenes.map((scene) => (
          <div
            key={scene.id}
            className={`tab-content ${
              activeSceneId === scene.id ? "active" : ""
            }`}
          >
            <div className="scene-details">
              <h3 className="scene-title">{scene.name}</h3>
              {scene.description && (
                <p className="scene-description">{scene.description}</p>
              )}
            </div>

            {/* Physics Feature Tabs */}
            <div className="scene-tabs">
              <div className="scene-tabs-header">
                <button
                  className={activeTab === "objects" ? "active" : ""}
                  onClick={() => setActiveTab("objects")}
                >
                  <Icon name="objects" size="small" /> Physics Objects
                </button>
                <button
                  className={activeTab === "parameters" ? "active" : ""}
                  onClick={() => setActiveTab("parameters")}
                >
                  <Icon name="physics" size="small" /> Physics Parameters
                </button>
              </div>

              <div className="scene-tabs-content">
                {/* Physics Objects Tab */}
                <div
                  className={`tab-panel ${
                    activeTab === "objects" ? "active" : ""
                  }`}
                >
                  <PhysicsObjectsManager sceneId={scene.id} />
                </div>

                {/* Physics Parameters Tab */}
                <div
                  className={`tab-panel ${
                    activeTab === "parameters" ? "active" : ""
                  }`}
                >
                  <PhysicsParametersManager sceneId={scene.id} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="scene-manager">
      <div className="scene-manager-header">
        <div className="scene-manager-title">
          <Icon name="scene" size="large" />
          <h2>Scene Manager</h2>
        </div>
        <div className="scene-manager-actions">
          <Button variant="secondary" onClick={fetchScenes} disabled={loading}>
            <Icon name="refresh" size="small" />
            Refresh
          </Button>
          <Button variant="primary" onClick={handleAddScene}>
            <Icon name="plus" size="small" />
            New Scene
          </Button>
        </div>
      </div>

      <div className="scene-manager-content">{renderSceneTabs()}</div>
    </div>
  );
};

export default SceneManager;
