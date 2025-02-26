import {
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import {
  Button as AntButton,
  Modal as AntModal,
  Card,
  Empty,
  Form,
  message,
  Spin,
  Tabs,
  Typography,
} from 'antd';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, endpoints } from '../../../utils/api';
import Button from '../../common/Button';
import Modal from '../../common/Modal';
import PhysicsObjectsManager from '../physicsObjects/PhysicsObjectsManager';
import './Scenes.css';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { confirm } = AntModal;

const SceneManager = () => {
  const { id: universeId } = useParams();
  const [scenes, setScenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSceneId, setActiveSceneId] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [isEditing, setIsEditing] = useState(false);
  const [currentScene, setCurrentScene] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [formErrors, setFormErrors] = useState({
    name: '',
    description: '',
  });

  // Fetch scenes when component mounts or universeId changes
  useEffect(() => {
    fetchScenes();
  }, [universeId]);

  // Fetch scenes for the current universe
  const fetchScenes = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `${endpoints.universes.detail(universeId)}/scenes`
      );
      setScenes(response || []);

      // Set active scene to the first one if available
      if (response.length > 0 && !activeSceneId) {
        setActiveSceneId(response[0].id);
      }

      setError(null);
    } catch (err) {
      console.error('Failed to fetch scenes:', err);
      setError('Failed to load scenes. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle tab change (scene selection)
  const handleTabChange = activeKey => {
    setActiveSceneId(activeKey);
  };

  // Open modal for creating a new scene
  const handleAddScene = () => {
    setIsEditing(false);
    setCurrentScene(null);
    setFormData({
      name: '',
      description: '',
    });
    setFormErrors({
      name: '',
      description: '',
    });
    setIsModalVisible(true);
  };

  // Open modal for editing a scene
  const handleEditScene = scene => {
    setIsEditing(true);
    setCurrentScene(scene);
    setFormData({
      name: scene.name,
      description: scene.description || '',
    });
    setFormErrors({
      name: '',
      description: '',
    });
    setIsModalVisible(true);
  };

  // Handle scene deletion
  const handleDeleteScene = scene => {
    confirm({
      title: 'Are you sure you want to delete this scene?',
      icon: <ExclamationCircleOutlined />,
      content: 'This action cannot be undone.',
      okText: 'Yes, delete it',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await api.delete(
            `${endpoints.universes.detail(universeId)}/scenes/${scene.id}`
          );
          message.success('Scene deleted successfully');

          // Update scenes list
          setScenes(scenes.filter(s => s.id !== scene.id));

          // If the active scene was deleted, set the first available scene as active
          if (activeSceneId === scene.id) {
            const remainingScenes = scenes.filter(s => s.id !== scene.id);
            if (remainingScenes.length > 0) {
              setActiveSceneId(remainingScenes[0].id);
            } else {
              setActiveSceneId(null);
            }
          }
        } catch (err) {
          console.error('Failed to delete scene:', err);
          message.error('Failed to delete scene. Please try again later.');
        }
      },
    });
  };

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Scene name is required';
    } else if (formData.name.length > 100) {
      errors.name = 'Scene name must be less than 100 characters';
    }

    if (formData.description && formData.description.length > 500) {
      errors.description = 'Description must be less than 500 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission (create/edit scene)
  const handleFormSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      if (isEditing && currentScene) {
        // Update existing scene
        await api.put(
          `${endpoints.universes.detail(universeId)}/scenes/${currentScene.id}`,
          formData
        );
        message.success('Scene updated successfully');

        // Update scenes list
        setScenes(
          scenes.map(s =>
            s.id === currentScene.id ? { ...s, ...formData } : s
          )
        );
      } else {
        // Create new scene
        const newScene = await api.post(
          `${endpoints.universes.detail(universeId)}/scenes`,
          {
            ...formData,
            universe_id: universeId,
          }
        );

        message.success('Scene created successfully');

        // Add new scene to list and set it as active
        setScenes([...scenes, newScene]);
        setActiveSceneId(newScene.id);
      }

      setIsModalVisible(false);
    } catch (err) {
      console.error('Failed to save scene:', err);
      message.error('Failed to save scene. Please try again later.');
    }
  };

  // Render scenes as tabs
  const renderSceneTabs = () => {
    if (loading) {
      return <Spin size="large" />;
    }

    if (error) {
      return <div className="error-message">{error}</div>;
    }

    if (scenes.length === 0) {
      return (
        <Empty
          description="No scenes found"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button onClick={handleAddScene}>Create Scene</Button>
        </Empty>
      );
    }

    return (
      <Tabs
        activeKey={activeSceneId}
        onChange={handleTabChange}
        type="card"
        tabBarExtraContent={
          <AntButton
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddScene}
          >
            Add Scene
          </AntButton>
        }
      >
        {scenes.map(scene => (
          <TabPane
            tab={
              <span>
                {scene.name}
                <div className="scene-tab-actions">
                  <AntButton
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={e => {
                      e.stopPropagation();
                      handleEditScene(scene);
                    }}
                  />
                  <AntButton
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={e => {
                      e.stopPropagation();
                      handleDeleteScene(scene);
                    }}
                  />
                </div>
              </span>
            }
            key={scene.id}
          >
            <Card>
              <div className="scene-details">
                <Title level={4}>{scene.name}</Title>
                {scene.description && (
                  <Text type="secondary">{scene.description}</Text>
                )}
              </div>

              {/* Physics Objects Management */}
              <PhysicsObjectsManager sceneId={scene.id} />
            </Card>
          </TabPane>
        ))}
      </Tabs>
    );
  };

  return (
    <div className="scene-manager">
      <div className="scene-manager-header">
        <h2 className="section-title">Scenes</h2>
        {scenes.length > 0 && (
          <Button onClick={handleAddScene}>Add Scene</Button>
        )}
      </div>

      {renderSceneTabs()}

      {/* Create/Edit Scene Modal */}
      <Modal
        isOpen={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        title={isEditing ? 'Edit Scene' : 'Create New Scene'}
      >
        <div className="scene-form">
          <div className="form-group">
            <label htmlFor="name">Scene Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter a name for your scene"
              className={formErrors.name ? 'input-error' : ''}
            />
            {formErrors.name && (
              <div className="error-text">{formErrors.name}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe what happens in this scene"
              rows="4"
              className={formErrors.description ? 'input-error' : ''}
            />
            {formErrors.description && (
              <div className="error-text">{formErrors.description}</div>
            )}
          </div>

          <div className="modal-actions">
            <Button onClick={handleFormSubmit}>
              {isEditing ? 'Save Changes' : 'Create Scene'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setIsModalVisible(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SceneManager;
