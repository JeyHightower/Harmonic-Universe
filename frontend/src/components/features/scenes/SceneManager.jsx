import {
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Empty,
  Form,
  Input,
  message,
  Modal,
  Spin,
  Tabs,
  Typography,
} from 'antd';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, endpoints } from '../../../utils/api';
import PhysicsObjectsManager from '../physicsObjects/PhysicsObjectsManager';
import './Scenes.css';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { confirm } = Modal;

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
    form.resetFields();
    setIsModalVisible(true);
  };

  // Open modal for editing a scene
  const handleEditScene = scene => {
    setIsEditing(true);
    setCurrentScene(scene);
    form.setFieldsValue({
      name: scene.name,
      description: scene.description || '',
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

  // Handle form submission (create/edit scene)
  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (isEditing && currentScene) {
        // Update existing scene
        await api.put(
          `${endpoints.universes.detail(universeId)}/scenes/${currentScene.id}`,
          values
        );
        message.success('Scene updated successfully');

        // Update scenes list
        setScenes(
          scenes.map(s => (s.id === currentScene.id ? { ...s, ...values } : s))
        );
      } else {
        // Create new scene
        const newScene = await api.post(
          `${endpoints.universes.detail(universeId)}/scenes`,
          {
            ...values,
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
      console.error('Form validation failed:', err);
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
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddScene}
          >
            Create Scene
          </Button>
        </Empty>
      );
    }

    return (
      <Tabs
        activeKey={activeSceneId}
        onChange={handleTabChange}
        type="card"
        tabBarExtraContent={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddScene}
          >
            Add Scene
          </Button>
        }
      >
        {scenes.map(scene => (
          <TabPane
            tab={
              <span>
                {scene.name}
                <div className="scene-tab-actions">
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={e => {
                      e.stopPropagation();
                      handleEditScene(scene);
                    }}
                  />
                  <Button
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
      <Title level={3}>Scenes</Title>

      {renderSceneTabs()}

      {/* Create/Edit Scene Modal */}
      <Modal
        title={isEditing ? 'Edit Scene' : 'Create Scene'}
        open={isModalVisible}
        onOk={handleFormSubmit}
        onCancel={() => setIsModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Scene Name"
            rules={[{ required: true, message: 'Please enter a scene name' }]}
          >
            <Input placeholder="Enter scene name" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea
              placeholder="Enter scene description"
              autoSize={{ minRows: 3, maxRows: 5 }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SceneManager;
