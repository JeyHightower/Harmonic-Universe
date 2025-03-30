import {
  AppstoreOutlined,
  PictureOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Button, Card, Col, Empty, Image, Row, Spin, Tabs, Tag } from 'antd';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { useModal } from '../../../contexts/ModalContext';
import { fetchUniverseById } from '../../../store/thunks/universeThunks';
import './VisualPage.css';

// Placeholder image for visualization examples
const PLACEHOLDER_IMAGES = [
  'https://via.placeholder.com/300x200/4361ee/ffffff?text=Visualization+1',
  'https://via.placeholder.com/300x200/3a0ca3/ffffff?text=Visualization+2',
  'https://via.placeholder.com/300x200/7209b7/ffffff?text=Visualization+3',
  'https://via.placeholder.com/300x200/f72585/ffffff?text=Visualization+4',
];

const VisualPage = () => {
  const { universeId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { openModal } = useModal();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('gallery');

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

  const handleCreateVisualization = () => {
    openModal('visualization-create', { universeId });
  };

  if (loading) {
    return (
      <div className="visual-page-loading">
        <Spin size="large" />
        <p>Loading visual environment...</p>
      </div>
    );
  }

  return (
    <div className="visual-page">
      <div className="visual-page-header">
        <h1>Visual Environment: {universe?.name}</h1>
        <p className="visual-page-description">
          Create and manage visual representations of your universe.
        </p>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        className="visual-tabs"
        items={[
          {
            key: 'gallery',
            label: 'Visualization Gallery',
            icon: <PictureOutlined />,
            children: (
              <div className="visual-tab-content">
                <div className="visual-actions">
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleCreateVisualization}
                  >
                    Create Visualization
                  </Button>
                </div>

                {PLACEHOLDER_IMAGES.length > 0 ? (
                  <div className="visual-gallery">
                    <Row gutter={[16, 16]}>
                      {PLACEHOLDER_IMAGES.map((image, index) => (
                        <Col xs={24} sm={12} md={8} lg={6} key={index}>
                          <Card
                            className="visual-card"
                            cover={
                              <div className="visual-image-container">
                                <Image
                                  src={image}
                                  alt={`Visualization ${index + 1}`}
                                  className="visual-image"
                                />
                              </div>
                            }
                            actions={[
                              <Button type="link" key="view">
                                View
                              </Button>,
                              <Button type="link" key="edit">
                                Edit
                              </Button>,
                              <Button type="link" key="delete" danger>
                                Delete
                              </Button>,
                            ]}
                          >
                            <Card.Meta
                              title={`Visualization ${index + 1}`}
                              description={`A sample visualization for ${universe?.name}`}
                            />
                            <div className="visual-tags">
                              <Tag color="blue">Scene {index + 1}</Tag>
                              <Tag color="purple">AI Generated</Tag>
                            </div>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </div>
                ) : (
                  <div className="visual-empty">
                    <Empty
                      description="No visualizations created yet"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                    <Button type="primary" onClick={handleCreateVisualization}>
                      Create Your First Visualization
                    </Button>
                  </div>
                )}
              </div>
            ),
          },
          {
            key: 'templates',
            label: 'Visual Templates',
            icon: <AppstoreOutlined />,
            children: (
              <div className="visual-tab-content">
                <div className="visual-templates">
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} md={8} lg={6}>
                      <Card
                        className="template-card"
                        hoverable
                        onClick={handleCreateVisualization}
                      >
                        <div className="template-icon">
                          <PlusOutlined />
                        </div>
                        <h3>Cosmic Scene</h3>
                        <p>Space-themed visualization with stars and nebulae</p>
                      </Card>
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={6}>
                      <Card
                        className="template-card"
                        hoverable
                        onClick={handleCreateVisualization}
                      >
                        <div className="template-icon">
                          <PlusOutlined />
                        </div>
                        <h3>Abstract Harmony</h3>
                        <p>
                          Abstract visualization based on harmony parameters
                        </p>
                      </Card>
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={6}>
                      <Card
                        className="template-card"
                        hoverable
                        onClick={handleCreateVisualization}
                      >
                        <div className="template-icon">
                          <PlusOutlined />
                        </div>
                        <h3>Physics Simulation</h3>
                        <p>
                          Visualization of physics objects and their
                          interactions
                        </p>
                      </Card>
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={6}>
                      <Card
                        className="template-card"
                        hoverable
                        onClick={handleCreateVisualization}
                      >
                        <div className="template-icon">
                          <PlusOutlined />
                        </div>
                        <h3>Custom Template</h3>
                        <p>Create a completely custom visualization</p>
                      </Card>
                    </Col>
                  </Row>
                </div>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};

export default VisualPage;
