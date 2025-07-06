/**
 * Universe Manager Component
 *
 * This component provides a comprehensive interface for managing universes,
 * including listing, creating, editing, and deleting universes.
 */

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/common/Button.jsx';
import Icon from '../../../components/common/Icon.jsx';
import Spinner from '../../../components/common/Spinner.jsx';
import { MODAL_TYPES } from '../../../constants/modalTypes';
import { useModalState } from '../../../hooks/useModalState';
import api from '../../../services/api.adapter';
import { fetchUniverses } from '../../../store/thunks/universeThunks';
import '../styles/Universe.css';

const UniverseManager = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { universes, loading, error } = useSelector((state) => state.universes);

  // Use Redux modal system
  const { open: openModal } = useModalState();

  // Fetch universes when component mounts
  useEffect(() => {
    dispatch(fetchUniverses());
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchUniverses());
  };

  const handleCreateUniverse = () => {
    openModal(MODAL_TYPES.UNIVERSE_CREATE, {
      mode: 'create',
      onSuccess: handleModalSuccess,
    });
  };

  const handleViewUniverse = (universe) => {
    openModal(MODAL_TYPES.UNIVERSE_CREATE, {
      mode: 'view',
      universe: universe,
      onSuccess: handleModalSuccess,
    });
  };

  const handleEditUniverse = (universe) => {
    openModal(MODAL_TYPES.UNIVERSE_CREATE, {
      mode: 'edit',
      universe: universe,
      onSuccess: handleModalSuccess,
    });
  };

  const handleDeleteUniverse = (universe) => {
    openModal(MODAL_TYPES.CONFIRMATION, {
      title: 'Delete Universe',
      message: `Are you sure you want to delete "${universe.name}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await api.deleteUniverse(universe.id);
          handleModalSuccess(universe, 'delete');
        } catch (error) {
          console.error('Error deleting universe:', error);
        }
      },
      confirmText: 'Delete',
      dangerMode: true,
    });
  };

  const handleModalSuccess = (universe, action) => {
    // Log the successful operation first
    console.log(`Universe ${action} successful:`, universe);

    // No need to refresh the universe list after create/update/delete
    // Redux already updates the store state which will reflect in the UI

    // If it's a newly created universe, navigate to it after a short delay to ensure UI update
    if (action === 'create' && universe && universe.id) {
      // Navigate to the new universe
      setTimeout(() => {
        handleNavigateToUniverse(universe.id);
      }, 100); // Small delay to ensure Redux state is properly updated
    }
  };

  const handleNavigateToUniverse = (universeId) => {
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
        {universes.map((universe) => (
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
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewUniverse(universe);
                }}
              >
                <Icon name="eye" size="small" />
              </button>
              <button
                className="action-button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditUniverse(universe);
                }}
              >
                <Icon name="edit" size="small" />
              </button>
              <button
                className="action-button danger"
                onClick={(e) => {
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
          <Button variant="secondary" onClick={handleRefresh} disabled={loading}>
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
    </div>
  );
};

export default UniverseManager;
