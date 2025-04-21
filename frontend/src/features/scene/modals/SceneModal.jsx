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
            // Handle specific error types
            const errorMsg = resultAction.error?.message || 'Failed to fetch scene data';

            if (errorMsg.includes('404') || errorMsg.includes('not found')) {
              // Special handling for 404 (not found) errors
              throw new Error(`Scene with ID ${formattedSceneId} not found. It may have been deleted or moved.`);
            } else {
              throw new Error(errorMsg);
            }
          }
        } catch (error) {
          console.error('SceneModal - Error loading scene data:', error);
          setError(`Failed to load scene data: ${error.message}`);
        } finally {
          setLoading(false);
        }
      };

      loadSceneData();
    }
  }, [formattedSceneId, initialData, actualMode, universeId, dispatch]);

  // Handle form submission (create/edit)
  const handleSubmit = async (formData) => {
    try {
      // Prevent multiple submissions - simple debounce
      if (loading) {
        console.log('SceneModal - Submission already in progress, ignoring duplicate submit');
        return;
      }

      setLoading(true);
      setError(null);

      // Create a unique request ID to track this submission
      const requestId = `scene_submit_${Date.now()}`;
      console.log(`SceneModal [${requestId}] - Processing form submission`);

      // Import only the thunks but use the component-level dispatch
      const { createSceneAndRefresh, updateSceneAndRefresh } = await import('../../../store/thunks/consolidated/scenesThunks');

      // Determine whether to create or update based on mode
      if (actualMode === 'create') {
        console.log(`SceneModal [${requestId}] - Creating new scene with form data:`, formData);

        // Ensure proper data format for the API
        const sceneData = {
          ...formData,
          universe_id: universeId,
          is_deleted: false // Explicitly set is_deleted to false
        };

        // Convert any date objects to string format
        if (sceneData.dateOfScene && typeof sceneData.dateOfScene !== 'string') {
          sceneData.date_of_scene = sceneData.dateOfScene.format('YYYY-MM-DD');
        }

        // Log the complete data being sent
        console.log(`SceneModal [${requestId}] - Formatted data for API:`, sceneData);
        console.log(`SceneModal [${requestId}] - Using universe ID:`, universeId);

        // Use a try-catch with timeout to ensure we don't get stuck
        try {
          // Dispatch create action with automatic refresh with timeout protection
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Create operation timed out after 15 seconds')), 15000)
          );

          const createPromise = dispatch(createSceneAndRefresh(sceneData));
          const resultAction = await Promise.race([createPromise, timeoutPromise]);

          if (createSceneAndRefresh.fulfilled.match(resultAction)) {
            console.log(`SceneModal [${requestId}] - Scene created successfully:`, resultAction.payload);
            // Call onSuccess callback if provided
            if (onSuccess) onSuccess(resultAction.payload);
            onClose();
          } else {
            // Log detailed error information
            console.error(`SceneModal [${requestId}] - Scene creation failed:`, resultAction.error);
            throw new Error(
              resultAction.error?.message ||
              'Failed to create scene. Please check the console for more details.'
            );
          }
        } catch (createError) {
          console.error(`SceneModal [${requestId}] - Scene creation error:`, createError);
          throw createError;
        }
      } else if (actualMode === 'edit') {
        console.log(`SceneModal [${requestId}] - Updating scene with ID:`, formattedSceneId);
        console.log(`SceneModal [${requestId}] - Update data:`, formData);

        // Ensure proper data format for the API
        const sceneData = {
          id: formattedSceneId,
          ...formData,
          universe_id: universeId,
          is_deleted: false // Explicitly set is_deleted to false
        };

        // Convert any date objects to string format
        if (sceneData.dateOfScene && typeof sceneData.dateOfScene !== 'string') {
          sceneData.date_of_scene = sceneData.dateOfScene.format('YYYY-MM-DD');
        }

        // Log the complete data being sent
        console.log(`SceneModal [${requestId}] - Formatted update data for API:`, sceneData);

        // Dispatch update action with automatic refresh and timeout protection
        try {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Update operation timed out after 15 seconds')), 15000)
          );

          const updatePromise = dispatch(updateSceneAndRefresh({
            sceneId: formattedSceneId,
            sceneData: sceneData
          }));

          const resultAction = await Promise.race([updatePromise, timeoutPromise]);

          if (updateSceneAndRefresh.fulfilled.match(resultAction)) {
            console.log(`SceneModal [${requestId}] - Scene updated successfully:`, resultAction.payload);
            // Call onSuccess callback if provided
            if (onSuccess) onSuccess(resultAction.payload);
            onClose();
          } else {
            // Log detailed error information
            console.error(`SceneModal [${requestId}] - Scene update failed:`, resultAction.error);
            throw new Error(
              resultAction.error?.message ||
              'Failed to update scene. Please check the console for more details.'
            );
          }
        } catch (updateError) {
          console.error(`SceneModal [${requestId}] - Scene update error:`, updateError);
          throw updateError;
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
      const { deleteSceneAndRefresh } = await import('../../../store/thunks/consolidated/scenesThunks');

      // Dispatch delete action with automatic refresh
      const resultAction = await dispatch(deleteSceneAndRefresh({
        sceneId: formattedSceneId,
        universeId: universeId
      }));

      if (deleteSceneAndRefresh.fulfilled.match(resultAction)) {
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
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          height: 'auto',
          maxHeight: '90vh',
          width: '100%',
          maxWidth: '800px',
          overflowY: 'auto',
          transition: 'none',
        }
      }}
      TransitionProps={{
        timeout: 300
      }}
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
