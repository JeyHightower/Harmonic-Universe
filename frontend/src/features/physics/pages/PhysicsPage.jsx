import { Card, Empty, Spin, Tabs } from 'antd';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import Button from '../../../components/common/Button';
import { useModalState } from '../../../hooks/useModalState';
import { fetchUniverseById } from '../../../store/thunks/universeThunks.mjs';
import '../../../styles/PhysicsPage.css';

const PhysicsPage = () => {
  const { universeId } = useParams();
  const dispatch = useDispatch();
  const { open } = useModalState();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('objects');

  const universe = useSelector((state) => state.universes.currentUniverse);

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

  const handleCreatePhysicsObject = () => {
    open('physics-object', { universeId });
  };

  const handleCreatePhysicsParameter = () => {
    open('physics-parameters', { universeId });
  };

  const handleCreatePhysicsConstraint = () => {
    open('physics-constraint', { universeId });
  };

  if (loading) {
    return (
      <div className="physics-page-loading">
        <Spin size="large" />
        <p>Loading physics environment...</p>
      </div>
    );
  }

  return (
    <div className="physics-page">
      <div className="physics-page-header">
        <h1>Physics Environment: {universe?.name}</h1>
        <p className="physics-page-description">
          Define the physical properties and behaviors of your universe.
        </p>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        className="physics-tabs"
        items={[
          {
            key: 'objects',
            label: 'Physics Objects',
            children: (
              <div className="physics-tab-content">
                <div className="physics-actions">
                  <Button variant="primary" onClick={handleCreatePhysicsObject}>
                    Create Physics Object
                  </Button>
                </div>

                <div className="physics-content">
                  <Card className="physics-card">
                    <Empty
                      description="No physics objects defined yet"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                    <Button variant="primary" onClick={handleCreatePhysicsObject}>
                      Create Your First Physics Object
                    </Button>
                  </Card>
                </div>
              </div>
            ),
          },
          {
            key: 'parameters',
            label: 'Physics Parameters',
            children: (
              <div className="physics-tab-content">
                <div className="physics-actions">
                  <Button variant="primary" onClick={handleCreatePhysicsParameter}>
                    Create Physics Parameter
                  </Button>
                </div>

                <div className="physics-content">
                  <Card className="physics-card">
                    <Empty
                      description="No physics parameters defined yet"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                    <Button variant="primary" onClick={handleCreatePhysicsParameter}>
                      Create Your First Physics Parameter
                    </Button>
                  </Card>
                </div>
              </div>
            ),
          },
          {
            key: 'constraints',
            label: 'Physics Constraints',
            children: (
              <div className="physics-tab-content">
                <div className="physics-actions">
                  <Button variant="primary" onClick={handleCreatePhysicsConstraint}>
                    Create Physics Constraint
                  </Button>
                </div>

                <div className="physics-content">
                  <Card className="physics-card">
                    <Empty
                      description="No physics constraints defined yet"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                    <Button variant="primary" onClick={handleCreatePhysicsConstraint}>
                      Create Your First Physics Constraint
                    </Button>
                  </Card>
                </div>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};

export default PhysicsPage;
