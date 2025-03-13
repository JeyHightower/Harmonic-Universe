import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchUniverses } from '../../../store/thunks/universeThunks';
import Button from '../../common/Button';
import Icon from '../../common/Icon';
import Modal from '../../common/Modal';
import Spinner from '../../common/Spinner';
import './Universe.css';
import UniverseModal from './UniverseModal';

const UniverseManager = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { universes, loading, error } = useSelector(state => state.universes);

  const [selectedUniverse, setSelectedUniverse] = useState(null);
  const [modalMode, setModalMode] = useState(null); // 'create', 'edit', 'view', 'delete'
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Fetch universes when component mounts
  useEffect(() => {
    dispatch(fetchUniverses());
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchUniverses());
  };

  const handleCreateUniverse = () => {
    setSelectedUniverse(null);
    setModalMode('create');
    setIsModalVisible(true);
  };

  const handleViewUniverse = universe => {
    setSelectedUniverse(universe);
    setModalMode('view');
    setIsModalVisible(true);
  };

  const handleEditUniverse = universe => {
    setSelectedUniverse(universe);
    setModalMode('edit');
    setIsModalVisible(true);
  };

  const handleDeleteUniverse = universe => {
    setSelectedUniverse(universe);
    setModalMode('delete');
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
  };

  const handleModalSuccess = action => {
    if (action === 'delete') {
      // No need to navigate, just refresh the list
      handleRefresh();
    } else if (action === 'create' || action === 'update') {
      handleRefresh();
    }
  };

  const handleNavigateToUniverse = universeId => {
    navigate(`/universes/${universeId}`);
  };

  const renderUniverseItems = () => {
    if (loading) {
      return (
        <div className="loading-container">
          <Spinner size="large" />
          <p>Loading universes...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="error-container">
          <Icon name="error" size="large" />
          <p>Error loading universes: {error}</p>
          <Button variant="secondary" onClick={handleRefresh}>
            <Icon name="refresh" size="small" />
            Try Again
          </Button>
        </div>
      );
    }

    if (!universes || universes.length === 0) {
      return (
        <div className="empty-container">
          <Icon name="universe" size="large" />
          <p>No universes found</p>
          <Button variant="primary" onClick={handleCreateUniverse}>
            <Icon name="plus" size="small" />
            Create New Universe
          </Button>
        </div>
      );
    }

    return (
      <div className="universe-list">
        {universes.map(universe => (
          <div
            key={universe.id}
            className="universe-item"
            onClick={() => handleNavigateToUniverse(universe.id)}
          >
            <div className="universe-item-icon">
              <Icon name="universe" size="medium" />
            </div>
            <div className="universe-item-content">
              <h3 className="universe-item-title">{universe.name}</h3>
              <p className="universe-item-description">
                {universe.description || 'No description'}
              </p>
            </div>
            <div className="universe-item-actions">
              <button
                className="action-button"
                onClick={e => {
                  e.stopPropagation();
                  handleViewUniverse(universe);
                }}
              >
                <Icon name="eye" size="small" />
              </button>
              <button
                className="action-button"
                onClick={e => {
                  e.stopPropagation();
                  handleEditUniverse(universe);
                }}
              >
                <Icon name="edit" size="small" />
              </button>
              <button
                className="action-button danger"
                onClick={e => {
                  e.stopPropagation();
                  handleDeleteUniverse(universe);
                }}
              >
                <Icon name="delete" size="small" />
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="universe-manager">
      <div className="universe-manager-header">
        <div className="universe-manager-title">
          <Icon name="universe" size="large" />
          <h2>Universe Manager</h2>
        </div>
        <div className="universe-manager-actions">
          <Button
            variant="secondary"
            onClick={handleRefresh}
            disabled={loading}
          >
            <Icon name="refresh" size="small" />
            Refresh
          </Button>
          <Button variant="primary" onClick={handleCreateUniverse}>
            <Icon name="plus" size="small" />
            New Universe
          </Button>
        </div>
      </div>

      <div className="universe-manager-content">{renderUniverseItems()}</div>

      <Modal
        isVisible={isModalVisible}
        onClose={handleModalClose}
        width="800px"
      >
        {isModalVisible && (
          <UniverseModal
            universeId={selectedUniverse?.id}
            initialData={selectedUniverse}
            mode={modalMode}
            onClose={handleModalClose}
            onSuccess={handleModalSuccess}
          />
        )}
      </Modal>
    </div>
  );
};

export default UniverseManager;
