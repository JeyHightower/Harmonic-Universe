import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Dialog, DialogTitle, DialogContent } from '@mui/material';
import SceneForm from '../pages/SceneForm';
import SceneViewer from '../components/SceneViewer';
import { MODAL_CONFIG } from '../../../utils/config';
import apiClient from '../../../services/api.adapter';
import SceneDeleteConfirmation from './SceneDeleteConfirmation';

/**
 * SceneModal component
 * 
 * A unified modal for handling all scene operations: create, edit, view, and delete
 * Replaces the consolidated SceneModalComponent with a more modular approach
 */
const SceneModal = ({
  // Props from consolidated component
  open,
  isOpen, // Alternate prop for backward compatibility
  onClose,
  onSuccess,
  universeId,
  sceneId,
  initialData = null,
  // Support both modalType and mode props for backward compatibility
  modalType = 'create',
  mode = null,
}) => {
  // For backward compatibility with both open and isOpen props
  const isModalOpen = open || isOpen || false;
  
  // Support both modalType and mode props for backward compatibility
  const actualMode = mode || modalType;

  const [scene, setScene] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Get modal title based on mode
  const getModalTitle = () => {
    switch (actualMode) {
      case 'create':
        return 'Create New Scene';
      case 'edit':
        return 'Edit Scene';
      case 'view':
        return 'Scene Details';
      case 'delete':
        return 'Delete Scene';
      default:
        return 'Scene';
    }
  };

  // Load scene data if we have a sceneId but no initialData
  useEffect(() => {
    if (sceneId && !initialData && (actualMode === 'edit' || actualMode === 'view' || actualMode === 'delete')) {
      const loadSceneData = async () => {
        try {
          setLoading(true);
          setError(null);

          const response = await apiClient.getScene(sceneId);
          const sceneData = response.data?.scene || response.data;

          if (sceneData) {
            setScene(sceneData);
          }
        } catch (error) {
          console.error("Error loading scene data:", error);
          setError("Failed to load scene data. Please try refreshing the page.");
        } finally {
          setLoading(false);
        }
      };

      loadSceneData();
    } else if (initialData) {
      setScene(initialData);
    }
  }, [sceneId, initialData, actualMode]);

  // Handle form submission for create/edit modes
  const handleSubmit = async (formData) => {
    try {
      setLoading(true);
      setError(null);

      let result;
      if (actualMode === 'create') {
        // Create the scene using the API
        const response = await apiClient.createScene(universeId, formData);
        result = response.data?.scene || response.data;
      } else if (actualMode === 'edit') {
        // Update the scene using the API
        const response = await apiClient.updateScene(sceneId, formData);
        result = response.data?.scene || response.data;
      }

      // Call success callback if provided
      if (onSuccess) {
        onSuccess(result);
      }

      // Close the modal
      onClose();
    } catch (error) {
      console.error("Error saving scene:", error);
      setError(error.message || "An error occurred while saving the scene");
    } finally {
      setLoading(false);
    }
  };

  // Handle scene deletion
  const handleDelete = async () => {
    try {
      setLoading(true);
      setError(null);

      await apiClient.deleteScene(sceneId);

      // Call success callback if provided
      if (onSuccess) {
        onSuccess({ id: sceneId, deleted: true });
      }

      // Close the modal
      onClose();
    } catch (error) {
      console.error("Error deleting scene:", error);
      setError(error.message || "An error occurred while deleting the scene");
    } finally {
      setLoading(false);
    }
  };

  // Render the appropriate content based on mode
  const renderContent = () => {
    // Show loading indicator while loading data
    if (loading) {
      return (
        <div className="scene-modal-loading">
          <div className="spinner" />
          <p>Loading scene data...</p>
        </div>
      );
    }

    // Show error message if there's an error
    if (error) {
      return (
        <div className="scene-modal-error">
          <p className="error-message">{error}</p>
          <button onClick={() => setError(null)}>Try Again</button>
        </div>
      );
    }

    // Render content based on mode
    switch (actualMode) {
      case 'create':
        return (
          <SceneForm
            universeId={universeId}
            onSubmit={handleSubmit}
            onCancel={onClose}
          />
        );
      case 'edit':
        return (
          <SceneForm
            universeId={universeId}
            sceneId={sceneId}
            initialData={scene || initialData}
            onSubmit={handleSubmit}
            onCancel={onClose}
          />
        );
      case 'view':
        return (
          <SceneViewer
            scene={scene || initialData}
            onClose={onClose}
          />
        );
      case 'delete':
        return (
          <SceneDeleteConfirmation
            scene={scene || initialData}
            onDelete={handleDelete}
            onCancel={onClose}
            isLoading={loading}
          />
        );
      default:
        return <p>Invalid mode: {actualMode}</p>;
    }
  };

  return (
    <Dialog
      open={isModalOpen}
      onClose={onClose}
      aria-labelledby="scene-modal-title"
      aria-describedby="scene-modal-description"
    >
      <DialogTitle id="scene-modal-title">{getModalTitle()}</DialogTitle>
      <DialogContent>
        <div className="scene-modal">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

SceneModal.propTypes = {
  // Support both open and isOpen props
  open: PropTypes.bool,
  isOpen: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  universeId: PropTypes.string,
  sceneId: PropTypes.string,
  initialData: PropTypes.object,
  // Support both modalType and mode props
  modalType: PropTypes.oneOf(['create', 'edit', 'view', 'delete']),
  mode: PropTypes.oneOf(['create', 'edit', 'view', 'delete']),
};

export default SceneModal; 