import {
  PlayCircleOutlined,
  SettingOutlined,
  SoundOutlined,
} from '@ant-design/icons';
import { Button, Card, Col, Empty, Row, Slider, Spin, Tabs } from 'antd';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { useModal } from '../../../contexts/ModalContext';
import { fetchUniverseById } from '../../../store/thunks/universeThunks';
import './HarmonyPage.css';

const HarmonyPage = () => {
  const { universeId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { openModal } = useModal();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('parameters');
  const [audioSettings, setAudioSettings] = useState({
    tempo: 120,
    volume: 75,
    reverb: 30,
    delay: 20,
  });

  const universe = useSelector(state => state.universe.currentUniverse);

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
  }, [dispatch, universeId]);

  const handleCreateHarmonyParameter = () => {
    openModal('harmony-parameters', { universeId });
  };

  const handleGenerateMusic = () => {
    openModal('audio-generate', { universeId });
  };

  const handleSettingChange = (setting, value) => {
    setAudioSettings(prev => ({
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

  return (
    <div className="harmony-page">
      <div className="harmony-page-header">
        <h1>Harmony Environment: {universe?.name}</h1>
        <p className="harmony-page-description">
          Define the musical properties and audio characteristics of your
          universe.
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
                  <Button type="primary" onClick={handleCreateHarmonyParameter}>
                    Create Harmony Parameter
                  </Button>
                </div>

                <div className="harmony-content">
                  <Card className="harmony-card">
                    <Empty
                      description="No harmony parameters defined yet"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                    <Button
                      type="primary"
                      onClick={handleCreateHarmonyParameter}
                    >
                      Create Your First Harmony Parameter
                    </Button>
                  </Card>
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
                  <p>
                    Generate music based on your universe's harmony parameters.
                  </p>

                  <div className="harmony-settings">
                    <Row gutter={[16, 24]}>
                      <Col span={12}>
                        <div className="harmony-setting">
                          <span>Tempo (BPM)</span>
                          <Slider
                            min={60}
                            max={200}
                            value={audioSettings.tempo}
                            onChange={value =>
                              handleSettingChange('tempo', value)
                            }
                          />
                          <span className="harmony-setting-value">
                            {audioSettings.tempo}
                          </span>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div className="harmony-setting">
                          <span>Volume</span>
                          <Slider
                            min={0}
                            max={100}
                            value={audioSettings.volume}
                            onChange={value =>
                              handleSettingChange('volume', value)
                            }
                          />
                          <span className="harmony-setting-value">
                            {audioSettings.volume}%
                          </span>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div className="harmony-setting">
                          <span>Reverb</span>
                          <Slider
                            min={0}
                            max={100}
                            value={audioSettings.reverb}
                            onChange={value =>
                              handleSettingChange('reverb', value)
                            }
                          />
                          <span className="harmony-setting-value">
                            {audioSettings.reverb}%
                          </span>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div className="harmony-setting">
                          <span>Delay</span>
                          <Slider
                            min={0}
                            max={100}
                            value={audioSettings.delay}
                            onChange={value =>
                              handleSettingChange('delay', value)
                            }
                          />
                          <span className="harmony-setting-value">
                            {audioSettings.delay}%
                          </span>
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
    </div>
  );
};

export default HarmonyPage;
