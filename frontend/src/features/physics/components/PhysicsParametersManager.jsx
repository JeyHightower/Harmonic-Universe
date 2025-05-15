import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import Button from '../../../components/common/Button';
import Icon from '../../../components/common/Icon';
import Spinner from '../../../components/common/Spinner';
import { MODAL_TYPES } from '../../../constants/modalTypes';
import { useModalState } from '../../../hooks/useModalState';
import apiClient from '../../../services/api';
import { endpoints } from '../../../services/endpoints';
import '../styles/PhysicsParameters.css';

const PhysicsParametersManager = ({ sceneId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [physicsParameters, setPhysicsParameters] = useState([]);
  const [selectedParamsId, setSelectedParamsId] = useState(null);
  const [modalMode, setModalMode] = useState('create');
  const [selectedParams, setSelectedParams] = useState(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // Use Redux modal system
  const modalRedux = useModalState();

  // Fetch physics parameters for the scene
  useEffect(() => {
    const fetchPhysicsParameters = async () => {
      if (selectedParamsId) {
        console.log('Fetching specific parameter:', selectedParamsId);
        const response = await apiClient.getPhysicsParameters(selectedParamsId);
        setPhysicsParameters(response.data);
      } else if (sceneId) {
        console.log('Fetching parameters for scene:', sceneId);
        const response = await apiClient.getPhysicsParametersForScene(sceneId);
        setPhysicsParameters(response.data);
      } else {
        console.log('No IDs provided, using default parameters');
        setPhysicsParameters([]);
      }
    };

    fetchPhysicsParameters();
  }, [selectedParamsId, sceneId]);

  // Handle adding new physics parameters
  const handleAddParameters = () => {
    setSelectedParams(null);
    setModalMode('create');
    modalRedux.open(MODAL_TYPES.PHYSICS_PARAMETERS, {
      sceneId,
      mode: 'create',
      onSuccess: handleModalSuccess,
      onClose: handleModalClose,
    });
  };

  // Handle viewing physics parameters
  const handleViewParameters = (params) => {
    setSelectedParams(params);
    setModalMode('view');
    modalRedux.open(MODAL_TYPES.PHYSICS_PARAMETERS, {
      sceneId,
      paramsId: params.id,
      initialData: params,
      mode: 'view',
      onSuccess: handleModalSuccess,
      onClose: handleModalClose,
    });
  };

  // Handle editing physics parameters
  const handleEditParameters = (params) => {
    setSelectedParams(params);
    setModalMode('edit');
    modalRedux.open(MODAL_TYPES.PHYSICS_PARAMETERS, {
      sceneId,
      paramsId: params.id,
      initialData: params,
      mode: 'edit',
      onSuccess: handleModalSuccess,
      onClose: handleModalClose,
    });
  };

  // Handle deleting physics parameters
  const handleDeleteParameters = (params) => {
    setSelectedParams(params);
    setModalMode('delete');
    modalRedux.open(MODAL_TYPES.PHYSICS_PARAMETERS, {
      sceneId,
      paramsId: params.id,
      initialData: params,
      mode: 'delete',
      onSuccess: handleModalSuccess,
      onClose: handleModalClose,
    });
  };

  // Handle modal success (create, edit, delete)
  const handleModalSuccess = (data, mode) => {
    if (mode === 'create') {
      // Add new parameters to the list
      setPhysicsParameters((prev) => [...prev, data]);
      setSelectedParamsId(data.id);
    } else if (mode === 'edit') {
      // Update existing parameters in the list
      setPhysicsParameters((prev) => prev.map((item) => (item.id === data.id ? data : item)));
    } else if (mode === 'delete') {
      // Remove parameters from the list
      setPhysicsParameters((prev) => prev.filter((item) => item.id !== data.id));

      // Update selected parameters if the deleted one was selected
      if (selectedParamsId === data.id) {
        const newList = physicsParameters.filter((item) => item.id !== data.id);
        setSelectedParamsId(newList.length > 0 ? newList[0].id : null);
      }
    }
  };

  // Handle modal close
  const handleModalClose = () => {
    modalRedux.close();
    setSelectedParams(null);
  };

  // Apply physics parameters
  const handleApplyParameters = async (params) => {
    try {
      await apiClient.post(
        `${endpoints.scenes.detail(sceneId)}/physics_parameters/${params.id}/apply`
      );
      // Update UI to indicate parameters are applied
      setPhysicsParameters((prev) =>
        prev.map((item) => ({
          ...item,
          is_active: item.id === params.id,
        }))
      );
    } catch (error) {
      console.error('Error applying physics parameters:', error);
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
        {physicsParameters.map((params) => (
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
                {params.is_active && <span className="active-badge">Active</span>}
              </h3>
              {params.description && <p>{params.description}</p>}
              <div className="physics-parameters-item-details">
                <span>
                  Gravity: ({params.gravity_x.toFixed(2)}, {params.gravity_y.toFixed(2)},{' '}
                  {params.gravity_z.toFixed(2)})
                </span>
                <span>Time Scale: {params.time_scale.toFixed(2)}x</span>
              </div>
            </div>
            <div className="physics-parameters-item-actions">
              <Button
                variant="text"
                icon="view"
                tooltip="View Details"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewParameters(params);
                }}
              />
              <Button
                variant="text"
                icon="edit"
                tooltip="Edit"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditParameters(params);
                }}
              />
              <Button
                variant="text"
                icon="delete"
                tooltip="Delete"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteParameters(params);
                }}
              />
              {!params.is_active && (
                <Button
                  variant="text"
                  icon="play"
                  tooltip="Apply to Scene"
                  onClick={(e) => {
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

    const params = physicsParameters.find((p) => p.id === selectedParamsId);
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
                <span className="property-value">{params.gravity_x.toFixed(2)}</span>
              </div>
              <div className="property-item">
                <span className="property-label">Y-axis:</span>
                <span className="property-value">{params.gravity_y.toFixed(2)}</span>
              </div>
              <div className="property-item">
                <span className="property-label">Z-axis:</span>
                <span className="property-value">{params.gravity_z.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="property-section">
            <h3>Simulation Settings</h3>
            <div className="property-grid">
              <div className="property-item">
                <span className="property-label">Time Scale:</span>
                <span className="property-value">{params.time_scale.toFixed(2)}x</span>
              </div>
              <div className="property-item">
                <span className="property-label">Solver Iterations:</span>
                <span className="property-value">{params.solver_iterations}</span>
              </div>
            </div>
          </div>

          <div className="property-section">
            <h3>Material Properties</h3>
            <div className="property-grid">
              <div className="property-item">
                <span className="property-label">Air Resistance:</span>
                <span className="property-value">{params.air_resistance.toFixed(2)}</span>
              </div>
              <div className="property-item">
                <span className="property-label">Bounce Factor:</span>
                <span className="property-value">{params.bounce_factor.toFixed(2)}</span>
              </div>
              <div className="property-item">
                <span className="property-label">Friction:</span>
                <span className="property-value">{params.friction.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="physics-parameters-actions">
          <Button variant="secondary" icon="edit" onClick={() => handleEditParameters(params)}>
            Edit
          </Button>

          {!params.is_active && (
            <Button variant="primary" icon="play" onClick={() => handleApplyParameters(params)}>
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
        <div className="physics-parameters-sidebar">{renderPhysicsParametersList()}</div>
        <div className="physics-parameters-main">{renderSelectedParametersDetails()}</div>
      </div>
    </div>
  );
};

export default PhysicsParametersManager;

// Add PropTypes validation
PhysicsParametersManager.propTypes = {
  sceneId: PropTypes.string.isRequired,
};
