import React, { useEffect, useState } from 'react';
import { api, endpoints } from '../../../utils/api';
import Button from '../../common/Button';
import Icon from '../../common/Icon';
import Modal from '../../common/Modal';
import Spinner from '../../common/Spinner';
import './PhysicsParameters.css';
import PhysicsParametersModal from './PhysicsParametersModal';

const PhysicsParametersManager = ({ sceneId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [physicsParameters, setPhysicsParameters] = useState([]);
  const [selectedParamsId, setSelectedParamsId] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedParams, setSelectedParams] = useState(null);

  // Fetch physics parameters for the scene
  useEffect(() => {
    const fetchPhysicsParameters = async () => {
      if (!sceneId) return;

      try {
        setLoading(true);
        setError(null);

        const response = await api.get(
          endpoints.scenes.physicsParameters.list(sceneId)
        );
        setPhysicsParameters(response.data || []);

        // Select the first parameters set if available
        if (response.data && response.data.length > 0 && !selectedParamsId) {
          setSelectedParamsId(response.data[0].id);
        }
      } catch (error) {
        console.error('Error fetching physics parameters:', error);
        setError('Failed to load physics parameters. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPhysicsParameters();
  }, [sceneId, selectedParamsId]);

  // Handle adding new physics parameters
  const handleAddParameters = async () => {
    try {
      const response = await api.post(
        endpoints.scenes.physicsParameters.create(sceneId),
        {
          scene_id: sceneId,
          // Add default values here
          gravity: {
            value: 9.81,
            unit: 'm/s²',
            min: 0,
            max: 20,
            enabled: true,
          },
          air_resistance: {
            value: 0.1,
            unit: 'kg/m³',
            min: 0,
            max: 1,
            enabled: true,
          },
          // Add other default parameters as needed
        }
      );
      setPhysicsParameters(prev => [...prev, response.data]);
      setSelectedParamsId(response.data.id);
    } catch (error) {
      console.error('Error creating physics parameters:', error);
      setError('Failed to create physics parameters. Please try again.');
    }
  };

  // Handle viewing physics parameters
  const handleViewParameters = params => {
    setSelectedParams(params);
    setModalMode('view');
    setIsModalVisible(true);
  };

  // Handle editing physics parameters
  const handleEditParameters = async (params, updatedData) => {
    try {
      if (!params || !params.id) {
        console.error('Cannot edit physics parameters: Invalid parameter ID');
        setError('Cannot edit physics parameters: Invalid parameter ID');
        return;
      }

      const response = await api.put(
        endpoints.scenes.physicsParameters.detail(sceneId, params.id),
        updatedData || params
      );

      setPhysicsParameters(prev =>
        prev.map(item => (item.id === response.data.id ? response.data : item))
      );
    } catch (error) {
      console.error('Error updating physics parameters:', error);
      setError('Failed to update physics parameters. Please try again.');
    }
  };

  // Handle deleting physics parameters
  const handleDeleteParameters = async params => {
    try {
      if (!params || !params.id) {
        console.error('Cannot delete physics parameters: Invalid parameter ID');
        setError('Cannot delete physics parameters: Invalid parameter ID');
        return;
      }

      await api.delete(
        endpoints.scenes.physicsParameters.detail(sceneId, params.id)
      );

      setPhysicsParameters(prev => prev.filter(item => item.id !== params.id));
      if (selectedParamsId === params.id) {
        const newList = physicsParameters.filter(item => item.id !== params.id);
        setSelectedParamsId(newList.length > 0 ? newList[0].id : null);
      }
    } catch (error) {
      console.error('Error deleting physics parameters:', error);
      setError('Failed to delete physics parameters. Please try again.');
    }
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedParams(null);
  };

  // Handle modal success (create, edit, delete)
  const handleModalSuccess = (data, mode) => {
    if (mode === 'create') {
      // Add new parameters to the list
      setPhysicsParameters(prev => [...prev, data]);
      setSelectedParamsId(data.id);
    } else if (mode === 'edit') {
      // Update existing parameters in the list
      setPhysicsParameters(prev =>
        prev.map(item => (item.id === data.id ? data : item))
      );
    } else if (mode === 'delete') {
      // Remove parameters from the list
      setPhysicsParameters(prev => prev.filter(item => item.id !== data.id));

      // Update selected parameters if the deleted one was selected
      if (selectedParamsId === data.id) {
        const newList = physicsParameters.filter(item => item.id !== data.id);
        setSelectedParamsId(newList.length > 0 ? newList[0].id : null);
      }
    }
  };

  // Apply physics parameters
  const handleApplyParameters = async params => {
    try {
      if (!params || !params.id) {
        console.error('Cannot apply physics parameters: Invalid parameter ID');
        setError('Cannot apply physics parameters: Invalid parameter ID');
        return;
      }

      await api.post(
        endpoints.scenes.physicsParameters.detail(sceneId, params.id) + '/apply'
      );

      // Update UI to indicate parameters are applied
      setPhysicsParameters(prev =>
        prev.map(item => ({
          ...item,
          is_active: item.id === params.id,
        }))
      );
    } catch (error) {
      console.error('Error applying physics parameters:', error);
      setError('Failed to apply physics parameters. Please try again.');
    }
  };

  // Render physics parameters list
  const renderPhysicsParametersList = () => {
    if (loading) {
      return (
        <div className="loading-container">
          <Spinner size="large" />
          <p>Loading physics parameters...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="error-message">
          <Icon name="error" /> {error}
        </div>
      );
    }

    if (physicsParameters.length === 0) {
      return (
        <div className="empty-message">
          <Icon name="physics" size="large" />
          <p>No physics parameters found for this scene.</p>
          <Button variant="primary" onClick={handleAddParameters} icon="plus">
            Create Physics Parameters
          </Button>
        </div>
      );
    }

    return (
      <div className="physics-parameters-list">
        {physicsParameters.map(params => (
          <div
            key={params.id}
            className={`physics-parameters-item ${
              selectedParamsId === params.id ? 'selected' : ''
            } ${params.is_active ? 'active' : ''}`}
            onClick={() => setSelectedParamsId(params.id)}
          >
            <div className="physics-parameters-item-content">
              <h3>
                {params.name || 'Unnamed Parameters'}
                {params.is_active && (
                  <span className="active-badge">Active</span>
                )}
              </h3>
              {params.description && <p>{params.description}</p>}
              <div className="physics-parameters-item-details">
                <span>
                  Gravity: ({params.gravity_x.toFixed(2)},{' '}
                  {params.gravity_y.toFixed(2)}, {params.gravity_z.toFixed(2)})
                </span>
                <span>Time Scale: {params.time_scale.toFixed(2)}x</span>
              </div>
            </div>
            <div className="physics-parameters-item-actions">
              <Button
                variant="text"
                icon="view"
                tooltip="View Details"
                onClick={e => {
                  e.stopPropagation();
                  handleViewParameters(params);
                }}
              />
              <Button
                variant="text"
                icon="edit"
                tooltip="Edit"
                onClick={e => {
                  e.stopPropagation();
                  handleEditParameters(params);
                }}
              />
              <Button
                variant="text"
                icon="delete"
                tooltip="Delete"
                onClick={e => {
                  e.stopPropagation();
                  handleDeleteParameters(params);
                }}
              />
              {!params.is_active && (
                <Button
                  variant="text"
                  icon="play"
                  tooltip="Apply to Scene"
                  onClick={e => {
                    e.stopPropagation();
                    handleApplyParameters(params);
                  }}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render selected parameters details
  const renderSelectedParametersDetails = () => {
    if (!selectedParamsId || physicsParameters.length === 0) {
      return null;
    }

    const params = physicsParameters.find(p => p.id === selectedParamsId);
    if (!params) return null;

    return (
      <div className="physics-parameters-details">
        <h2 className="physics-parameters-details-title">
          {params.name || 'Unnamed Parameters'}
          {params.is_active && <span className="active-badge">Active</span>}
        </h2>

        {params.description && (
          <p className="physics-parameters-description">{params.description}</p>
        )}

        <div className="physics-parameters-properties">
          <div className="property-section">
            <h3>Gravity</h3>
            <div className="property-grid">
              <div className="property-item">
                <span className="property-label">X-axis:</span>
                <span className="property-value">
                  {params.gravity_x.toFixed(2)}
                </span>
              </div>
              <div className="property-item">
                <span className="property-label">Y-axis:</span>
                <span className="property-value">
                  {params.gravity_y.toFixed(2)}
                </span>
              </div>
              <div className="property-item">
                <span className="property-label">Z-axis:</span>
                <span className="property-value">
                  {params.gravity_z.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="property-section">
            <h3>Simulation Settings</h3>
            <div className="property-grid">
              <div className="property-item">
                <span className="property-label">Time Scale:</span>
                <span className="property-value">
                  {params.time_scale.toFixed(2)}x
                </span>
              </div>
              <div className="property-item">
                <span className="property-label">Solver Iterations:</span>
                <span className="property-value">
                  {params.solver_iterations}
                </span>
              </div>
            </div>
          </div>

          <div className="property-section">
            <h3>Material Properties</h3>
            <div className="property-grid">
              <div className="property-item">
                <span className="property-label">Air Resistance:</span>
                <span className="property-value">
                  {params.air_resistance.toFixed(2)}
                </span>
              </div>
              <div className="property-item">
                <span className="property-label">Bounce Factor:</span>
                <span className="property-value">
                  {params.bounce_factor.toFixed(2)}
                </span>
              </div>
              <div className="property-item">
                <span className="property-label">Friction:</span>
                <span className="property-value">
                  {params.friction.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="physics-parameters-actions">
          <Button
            variant="secondary"
            icon="edit"
            onClick={() => handleEditParameters(params)}
          >
            Edit
          </Button>

          {!params.is_active && (
            <Button
              variant="primary"
              icon="play"
              onClick={() => handleApplyParameters(params)}
            >
              Apply to Scene
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="physics-parameters-manager">
      <div className="physics-parameters-manager-header">
        <h2>
          <Icon name="physics" /> Physics Parameters
        </h2>
        <Button variant="primary" icon="plus" onClick={handleAddParameters}>
          Create Parameters
        </Button>
      </div>

      <div className="physics-parameters-manager-content">
        <div className="physics-parameters-sidebar">
          {renderPhysicsParametersList()}
        </div>
        <div className="physics-parameters-main">
          {renderSelectedParametersDetails()}
        </div>
      </div>

      <Modal
        isVisible={isModalVisible}
        onClose={handleModalClose}
        width="600px"
      >
        {isModalVisible && (
          <PhysicsParametersModal
            sceneId={sceneId}
            paramsId={selectedParams?.id}
            onClose={handleModalClose}
            onSuccess={handleModalSuccess}
            mode={modalMode}
            initialData={selectedParams}
          />
        )}
      </Modal>
    </div>
  );
};

export default PhysicsParametersManager;
