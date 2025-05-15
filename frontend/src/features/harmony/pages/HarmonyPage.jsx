import {
  DeleteOutlined,
  EditOutlined,
  PlayCircleOutlined,
  SettingOutlined,
  SoundOutlined,
} from '@ant-design/icons';
import { Button, Card, Col, Empty, List, Modal, Row, Slider, Spin, Tabs, message } from 'antd';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { useModalState } from '../../../hooks/useModalState';
import { fetchUniverseById } from '../../../store/thunks/universeThunks';
import { api } from '../../../utils/api';
import '../styles/HarmonyPage.css';

const HarmonyPage = () => {
  const { universeId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { open } = useModalState();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('parameters');
  const [audioSettings, setAudioSettings] = useState({
    tempo: 120,
    volume: 75,
    reverb: 30,
    delay: 20,
  });
  const [harmonyParameters, setHarmonyParameters] = useState([]);
  const [fetchingParameters, setFetchingParameters] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [parameterToDelete, setParameterToDelete] = useState(null);

  const universe = useSelector((state) => state.universe.currentUniverse);

  useEffect(() => {
    const loadUniverse = async () => {
      try {
        setLoading(true);
        await dispatch(fetchUniverseById(universeId));
      } catch (error) {
        console.error('Error loading universe:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUniverse();
    fetchHarmonyParameters();
  }, [dispatch, universeId]);

  const fetchHarmonyParameters = async () => {
    try {
      setFetchingParameters(true);
      // Assuming we're working with scene-based harmony parameters for the universe's first scene
      // This may need to be adjusted based on your app's structure
      if (universe && universe.scenes && universe.scenes.length > 0) {
        const sceneId = universe.scenes[0].id;
        const response = await api.get(`/api/scenes/${sceneId}/harmony_parameters`);
        setHarmonyParameters(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching harmony parameters:', error);
      message.error('Failed to load harmony parameters');
    } finally {
      setFetchingParameters(false);
    }
  };

  const handleAddHarmonyParameter = () => {
    open('HARMONY_PARAMETERS', {
      universeId,
      onSave: async (newParameter) => {
        try {
          await api.post(`/universes/${universeId}/harmony-parameters`, newParameter);
          loadHarmonyParameters();
        } catch (error) {
          console.error('Error adding harmony parameter:', error);
        }
      },
    });
  };

  const handleEditHarmonyParameter = (parameter) => {
    // Get the first scene ID from the universe
    if (universe && universe.scenes && universe.scenes.length > 0) {
      const sceneId = universe.scenes[0].id;
      open('harmony-parameters', {
        universeId,
        sceneId,
        initialData: parameter,
        onClose: () => {
          fetchHarmonyParameters(); // Refresh the list after editing
          message.success('Harmony parameter updated successfully!');
        },
      });
    }
  };

  const showDeleteConfirm = (parameter) => {
    setParameterToDelete(parameter);
    setDeleteModalVisible(true);
  };

  const handleDeleteHarmonyParameter = async () => {
    if (!parameterToDelete) return;

    try {
      // Get the first scene ID from the universe
      if (universe && universe.scenes && universe.scenes.length > 0) {
        const sceneId = universe.scenes[0].id;
        await api.delete(`/api/scenes/${sceneId}/harmony_parameters/${parameterToDelete.id}`);

        // Update the local state to remove the deleted parameter
        setHarmonyParameters((prev) => prev.filter((p) => p.id !== parameterToDelete.id));
        message.success('Harmony parameter deleted successfully!');
      }
    } catch (error) {
      console.error('Error deleting harmony parameter:', error);
      message.error('Failed to delete harmony parameter');
    } finally {
      setDeleteModalVisible(false);
      setParameterToDelete(null);
    }
  };

  const handleGenerateMusic = () => {
    open('audio-generate', { universeId });
  };

  const handleSettingChange = (setting, value) => {
    setAudioSettings((prev) => ({
      ...prev,
      [setting]: value,
    }));
  };

  if (loading) {
    return (
      <div className="harmony-page-loading">
        <Spin size="large" />
        <p>Loading harmony environment...</p>
      </div>
    );
  }

  const renderHarmonyParametersList = () => {
    return (
      <List
        className="harmony-parameters-list"
        itemLayout="horizontal"
        dataSource={harmonyParameters}
        renderItem={(parameter) => (
          <List.Item
            actions={[
              <Button
                key="edit"
                icon={<EditOutlined />}
                onClick={() => handleEditHarmonyParameter(parameter)}
                title="Edit"
              />,
              <Button
                key="delete"
                icon={<DeleteOutlined />}
                danger
                onClick={() => showDeleteConfirm(parameter)}
                title="Delete"
              />,
            ]}
          >
            <List.Item.Meta
              title={parameter.name}
              description={parameter.description || 'No description'}
            />
            <div className="harmony-parameter-details">
              <span>Key: {parameter.key}</span>
              <span>Scale: {parameter.scale}</span>
              <span>Tempo: {parameter.tempo} BPM</span>
              <span>Mood: {parameter.mood}</span>
            </div>
          </List.Item>
        )}
      />
    );
  };

  return (
    <div className="harmony-page">
      <div className="harmony-page-header">
        <h1>Harmony Environment: {universe?.name}</h1>
        <p className="harmony-page-description">
          Define the musical properties and audio characteristics of your universe.
        </p>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        className="harmony-tabs"
        items={[
          {
            key: 'parameters',
            label: 'Harmony Parameters',
            icon: <SettingOutlined />,
            children: (
              <div className="harmony-tab-content">
                <div className="harmony-actions">
                  <Button variant="primary" onClick={handleAddHarmonyParameter}>
                    Create Harmony Parameter
                  </Button>
                </div>

                <div className="harmony-content">
                  {harmonyParameters.length === 0 && !fetchingParameters ? (
                    <Card className="harmony-card">
                      <Empty
                        description="No harmony parameters defined yet"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                      <Button type="primary" onClick={handleAddHarmonyParameter}>
                        Create Your First Harmony Parameter
                      </Button>
                    </Card>
                  ) : (
                    <div className="harmony-parameters-container">
                      {fetchingParameters ? (
                        <div className="harmony-loading-container">
                          <Spin size="large" />
                          <p>Loading harmony parameters...</p>
                        </div>
                      ) : (
                        renderHarmonyParametersList()
                      )}
                    </div>
                  )}
                </div>
              </div>
            ),
          },
          {
            key: 'generator',
            label: 'Music Generator',
            icon: <SoundOutlined />,
            children: (
              <div className="harmony-tab-content">
                <Card className="harmony-generator-card">
                  <h3>Music Generator</h3>
                  <p>Generate music based on your universe's harmony parameters.</p>

                  <div className="harmony-settings">
                    <Row gutter={[16, 24]}>
                      <Col span={12}>
                        <div className="harmony-setting">
                          <span>Tempo (BPM)</span>
                          <Slider
                            min={60}
                            max={200}
                            value={audioSettings.tempo}
                            onChange={(value) => handleSettingChange('tempo', value)}
                          />
                          <span className="harmony-setting-value">{audioSettings.tempo}</span>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div className="harmony-setting">
                          <span>Volume</span>
                          <Slider
                            min={0}
                            max={100}
                            value={audioSettings.volume}
                            onChange={(value) => handleSettingChange('volume', value)}
                          />
                          <span className="harmony-setting-value">{audioSettings.volume}%</span>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div className="harmony-setting">
                          <span>Reverb</span>
                          <Slider
                            min={0}
                            max={100}
                            value={audioSettings.reverb}
                            onChange={(value) => handleSettingChange('reverb', value)}
                          />
                          <span className="harmony-setting-value">{audioSettings.reverb}%</span>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div className="harmony-setting">
                          <span>Delay</span>
                          <Slider
                            min={0}
                            max={100}
                            value={audioSettings.delay}
                            onChange={(value) => handleSettingChange('delay', value)}
                          />
                          <span className="harmony-setting-value">{audioSettings.delay}%</span>
                        </div>
                      </Col>
                    </Row>
                  </div>

                  <div className="harmony-generate-actions">
                    <Button
                      type="primary"
                      icon={<PlayCircleOutlined />}
                      size="large"
                      onClick={handleGenerateMusic}
                    >
                      Generate Music
                    </Button>
                  </div>
                </Card>
              </div>
            ),
          },
        ]}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        title="Delete Harmony Parameter"
        open={deleteModalVisible}
        onOk={handleDeleteHarmonyParameter}
        onCancel={() => {
          setDeleteModalVisible(false);
          setParameterToDelete(null);
        }}
        okText="Delete"
        okButtonProps={{ danger: true }}
      >
        <p>Are you sure you want to delete "{parameterToDelete?.name}"?</p>
        <p>This action cannot be undone.</p>
      </Modal>
    </div>
  );
};

// Add display name to component to fix ESLint warning
HarmonyPage.displayName = 'HarmonyPage';

export default HarmonyPage;
