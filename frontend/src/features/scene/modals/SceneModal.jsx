import { Dialog, DialogContent, DialogTitle } from '@mui/material';
import PropTypes from 'prop-types';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
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
  const dispatch = useDispatch();

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

  // Ensure sceneId is properly formatted (string or number, not an object)
  const formattedSceneId = useMemo(() => {
    if (sceneId === null || sceneId === undefined) {
      return null;
    }

    // If sceneId is already a string or number, use it directly
    if (typeof sceneId === 'string' || typeof sceneId === 'number') {
      return String(sceneId); // Ensure consistent string format
    }

    // If sceneId is an object (likely a scene object), extract the id property
    if (typeof sceneId === 'object' && sceneId !== null && 'id' in sceneId) {
      return String(sceneId.id); // Ensure consistent string format
    }

    console.error('Invalid sceneId provided to SceneModal:', sceneId);
    return null;
  }, [sceneId]);

  // Add enhanced debug logging
  useEffect(() => {
    console.log('SceneModal - Props received:', {
      mode: actualMode,
      sceneId,
      formattedSceneId,
      universeId,
      hasInitialData: !!initialData
    });
  }, [actualMode, sceneId, formattedSceneId, universeId, initialData]);

  // Load scene data if we have a sceneId but no initialData
  useEffect(() => {
    if (
      formattedSceneId &&
      !initialData &&
      (actualMode === 'edit' || actualMode === 'view' || actualMode === 'delete')
    ) {
      const loadSceneData = async () => {
        try {
          setLoading(true);
          setError(null);

          console.log(`SceneModal - Loading scene data for ID: ${formattedSceneId}`);

          // Import only the thunk but use the component-level dispatch
          const { fetchSceneById } = await import('../../../store/thunks/consolidated/scenesThunks');

          const resultAction = await dispatch(fetchSceneById(formattedSceneId));

          if (fetchSceneById.fulfilled.match(resultAction)) {
            // Successfully fetched scene data from Redux
            const sceneData = resultAction.payload;

            // Handle both response formats - either direct scene object or {scene: sceneObject}
            let processedSceneData;
            if (sceneData && sceneData.scene) {
              // Response has {scene} property
              processedSceneData = sceneData.scene;
            } else if (sceneData && typeof sceneData === 'object') {
              // Response is the scene object directly
              processedSceneData = sceneData;
            } else {
              throw new Error('No valid scene data found in response');
            }

            // Ensure ID is explicitly set
            processedSceneData.id = processedSceneData.id || formattedSceneId;

            // Ensure universe_id is present if provided via props
            if (universeId && !processedSceneData.universe_id) {
              processedSceneData.universe_id = universeId;
            }

            console.log('SceneModal - Setting scene data from Redux:', processedSceneData);
            setScene(processedSceneData);
          } else {
            throw new Error(resultAction.error?.message || 'Failed to fetch scene data');
          }
        } catch (error) {
          console.error('SceneModal - Error loading scene data:', error);
          setError(`Failed to load scene data: ${error.message}`);
        } finally {
          setLoading(false);
        }
      };

      loadSceneData();
    } else if (initialData) {
      console.log('SceneModal - Using provided initialData:', initialData);
      setScene(initialData);
    }
  }, [formattedSceneId, initialData, actualMode, universeId, dispatch]);

  // Handle form submission (create/edit)
  const handleSubmit = async (formData) => {
    try {
      setLoading(true);
      setError(null);

      // Import only the thunks but use the component-level dispatch
      const { createScene, updateScene } = await import('../../../store/thunks/consolidated/scenesThunks');

      // Determine whether to create or update based on mode
      if (actualMode === 'create') {
        console.log('SceneModal - Creating new scene with data:', { ...formData, universe_id: universeId });

        // Add universe_id to form data if not present
        const sceneData = { ...formData, universe_id: universeId };

        // Dispatch create action
        const resultAction = await dispatch(createScene(sceneData));

        if (createScene.fulfilled.match(resultAction)) {
          console.log('SceneModal - Scene created successfully:', resultAction.payload);
          // Call onSuccess callback if provided
          if (onSuccess) onSuccess(resultAction.payload);
          onClose();
        } else {
          throw new Error(resultAction.error?.message || 'Failed to create scene');
        }
      } else if (actualMode === 'edit') {
        console.log('SceneModal - Updating scene with ID:', formattedSceneId);
        console.log('SceneModal - Update data:', formData);

        // Dispatch update action
        const resultAction = await dispatch(updateScene({ id: formattedSceneId, ...formData }));

        if (updateScene.fulfilled.match(resultAction)) {
          console.log('SceneModal - Scene updated successfully:', resultAction.payload);
          // Call onSuccess callback if provided
          if (onSuccess) onSuccess(resultAction.payload);
          onClose();
        } else {
          throw new Error(resultAction.error?.message || 'Failed to update scene');
        }
      }
    } catch (error) {
      console.error('SceneModal - Error submitting scene data:', error);
      setError(`Failed to save scene: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete confirmation
  const handleDelete = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('SceneModal - Deleting scene with ID:', formattedSceneId);

      // Import only the thunk but use the component-level dispatch
      const { deleteScene } = await import('../../../store/thunks/consolidated/scenesThunks');

      // Dispatch delete action
      const resultAction = await dispatch(deleteScene(formattedSceneId));

      if (deleteScene.fulfilled.match(resultAction)) {
        console.log('SceneModal - Scene deleted successfully:', resultAction.payload);
        // Call onSuccess callback if provided
        if (onSuccess) onSuccess(resultAction.payload);
        onClose();
      } else {
        throw new Error(resultAction.error?.message || 'Failed to delete scene');
      }
    } catch (error) {
      console.error('SceneModal - Error deleting scene:', error);
      setError(`Failed to delete scene: ${error.message}`);
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
            sceneId={formattedSceneId}
            initialData={scene || initialData}
            onSubmit={handleSubmit}
            onCancel={onClose}
          />
        );
      case 'view':
        // Ensure we have valid scene data, falling back to initialData if needed
        const sceneData = scene || initialData;
        if (!sceneData) {
          return (
            <div className="scene-modal-error">
              <p className="error-message">Scene data not found. Please try again.</p>
              <button onClick={onClose}>Close</button>
            </div>
          );
        }

        // Handle both possible scene structures (direct object or nested within scene property)
        const viewerData = sceneData.scene ? sceneData.scene : sceneData;

        // Verify we have a valid ID
        if (!viewerData.id) {
          return (
            <div className="scene-modal-error">
              <p className="error-message">Invalid scene data. Missing scene ID.</p>
              <button onClick={onClose}>Close</button>
            </div>
          );
        }

        return <SceneViewer scene={viewerData} onClose={onClose} />;
      case 'delete':
        if (!scene && !initialData) {
          // For delete operation without scene data, create minimal scene object with ID
          const fallbackScene = {
            id: formattedSceneId,
            name: 'Scene',
            universe_id: universeId
          };

          return (
            <SceneDeleteConfirmation
              scene={fallbackScene}
              onDelete={handleDelete}
              onCancel={onClose}
              isLoading={loading}
            />
          );
        }

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
  universeId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  sceneId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  initialData: PropTypes.object,
  // Support both modalType and mode props
  modalType: PropTypes.oneOf(['create', 'edit', 'view', 'delete']),
  mode: PropTypes.oneOf(['create', 'edit', 'view', 'delete']),
};

export default SceneModal;
