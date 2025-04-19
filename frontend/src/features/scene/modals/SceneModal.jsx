import { Dialog, DialogContent, DialogTitle } from '@mui/material';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { apiClient } from '../../../services/api.adapter.mjs';
import SceneViewer from '../components/SceneViewer';
import SceneForm from '../pages/SceneForm';
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
    if (
      sceneId &&
      !initialData &&
      (actualMode === 'edit' || actualMode === 'view' || actualMode === 'delete')
    ) {
      const loadSceneData = async () => {
        try {
          setLoading(true);
          setError(null);

          const response = await apiClient.scenes.getSceneById(sceneId);
          const sceneData = response.data?.scene || response.data;

          if (sceneData) {
            setScene(sceneData);
          }
        } catch (error) {
          console.error('Error loading scene data:', error);
          setError('Failed to load scene data. Please try refreshing the page.');
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
  const handleSubmit = async (action, formData) => {
    try {
      setLoading(true);
      setError(null);

      console.log('SceneModal - handleSubmit called with action:', action, 'and data:', formData);

      // Ensure universe_id is correctly set in the data
      const dataWithUniverseId = {
        ...formData,
        universe_id: universeId,
        // Also include as universeId for services that might expect it in camelCase
        universeId: universeId,
      };

      let result;
      if (action === 'create' || actualMode === 'create') {
        // Create the scene using the API
        console.log('SceneModal - Creating scene with data:', dataWithUniverseId);
        try {
          // Use the scenes service directly with proper error handling
          const response = await apiClient.scenes.createScene(dataWithUniverseId);
          console.log('SceneModal - Create scene response:', response);

          // Check different possible response formats
          if (response.data?.scene) {
            result = response.data.scene;
          } else if (response.data) {
            result = response.data;
          } else if (response.success && response.data) {
            result = response.data;
          } else {
            console.warn('SceneModal - Unexpected response format:', response);
            throw new Error('Unexpected response format from API');
          }
        } catch (createError) {
          console.error('SceneModal - Failed with scenes.createScene:', createError);

          // Fallback to direct API call with better error handling
          try {
            console.log('SceneModal - Attempting direct API call fallback');
            // Make sure we're sending the data properly formatted
            const formattedData = {
              ...dataWithUniverseId,
              // Ensure these fields are always present
              name: dataWithUniverseId.name || dataWithUniverseId.title || 'Untitled Scene',
              universe_id: dataWithUniverseId.universe_id || dataWithUniverseId.universeId,
            };

            const directResponse = await apiClient.post('/scenes/', formattedData);
            console.log('SceneModal - Direct API create response:', directResponse);

            if (directResponse.data?.scene) {
              result = directResponse.data.scene;
            } else if (directResponse.data) {
              result = directResponse.data;
            } else {
              throw new Error('Failed to create scene: Invalid response from API');
            }
          } catch (directError) {
            console.error('SceneModal - Direct API call failed too:', directError);
            throw new Error(`Failed to create scene: ${directError.message || 'Unknown error'}`);
          }
        }
      } else if (action === 'update' || actualMode === 'edit') {
        // Update the scene using the API
        console.log('SceneModal - Updating scene with data:', dataWithUniverseId);
        const response = await apiClient.scenes.updateScene(sceneId, dataWithUniverseId);
        console.log('SceneModal - Update scene response:', response);
        result = response.data?.scene || response.data;
      }

      // Ensure result has the expected structure
      if (!result) {
        console.error('SceneModal - API returned empty result');
        throw new Error('Failed to save scene. Empty response from API.');
      }

      console.log('SceneModal - Operation successful, calling onSuccess callback');

      // Call success callback if provided
      if (onSuccess) {
        onSuccess(result);
      }

      // Close the modal
      onClose();

      return result;
    } catch (error) {
      console.error('SceneModal - Error saving scene:', error);
      setError(error.message || 'An error occurred while saving the scene');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Handle scene deletion
  const handleDelete = async () => {
    try {
      setLoading(true);
      setError(null);

      await apiClient.scenes.deleteScene(sceneId);

      // Call success callback if provided
      if (onSuccess) {
        onSuccess({ id: sceneId, deleted: true });
      }

      // Close the modal
      onClose();
    } catch (error) {
      console.error('Error deleting scene:', error);
      setError(error.message || 'An error occurred while deleting the scene');
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
        return <SceneForm universeId={universeId} onSubmit={handleSubmit} onCancel={onClose} />;
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
        return <SceneViewer scene={scene || initialData} onClose={onClose} />;
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
        <div className="scene-modal">{renderContent()}</div>
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
