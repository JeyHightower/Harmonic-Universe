import { Dialog, DialogContent, DialogTitle } from '@mui/material';
import PropTypes from 'prop-types';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
  const [isContentMounted, setIsContentMounted] = useState(false);
  const dispatch = useDispatch();

  // Memoize modal title to prevent re-renders
  const modalTitle = useMemo(() => {
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
  }, [actualMode]);

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

  // Handle form submission (create/edit)
  const handleSubmit = useCallback(async (formData) => {
    try {
      if (loading) {
        console.log('SceneModal - Submission already in progress, ignoring duplicate submit');
        return;
      }

      setLoading(true);
      setError(null);

      const requestId = `scene_submit_${Date.now()}`;
      console.log(`SceneModal [${requestId}] - Processing form submission`);

      const { createSceneAndRefresh, updateSceneAndRefresh } = await import('../../../store/thunks/consolidated/scenesThunks');

      if (actualMode === 'create') {
        console.log(`SceneModal [${requestId}] - Creating new scene with form data:`, formData);

        const sceneData = {
          ...formData,
          universe_id: universeId,
          is_deleted: false
        };

        if (sceneData.dateOfScene && typeof sceneData.dateOfScene !== 'string') {
          sceneData.date_of_scene = sceneData.dateOfScene.format('YYYY-MM-DD');
        }

        console.log(`SceneModal [${requestId}] - Formatted data for API:`, sceneData);
        console.log(`SceneModal [${requestId}] - Using universe ID:`, universeId);

        try {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Create operation timed out after 15 seconds')), 15000)
          );

          const createPromise = dispatch(createSceneAndRefresh(sceneData));
          const resultAction = await Promise.race([createPromise, timeoutPromise]);

          if (createSceneAndRefresh.fulfilled.match(resultAction)) {
            console.log(`SceneModal [${requestId}] - Scene created successfully:`, resultAction.payload);
            if (onSuccess) onSuccess(resultAction.payload);
            onClose();
          } else {
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

        const sceneData = {
          id: formattedSceneId,
          ...formData,
          universe_id: universeId,
          is_deleted: false
        };

        if (sceneData.dateOfScene && typeof sceneData.dateOfScene !== 'string') {
          sceneData.date_of_scene = sceneData.dateOfScene.format('YYYY-MM-DD');
        }

        console.log(`SceneModal [${requestId}] - Formatted update data for API:`, sceneData);

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
            if (onSuccess) onSuccess(resultAction.payload);
            onClose();
          } else {
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
  }, [actualMode, formattedSceneId, universeId, dispatch, loading, onClose, onSuccess]);

  // Handle delete confirmation
  const handleDelete = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('SceneModal - Deleting scene with ID:', formattedSceneId);

      const { deleteSceneAndRefresh } = await import('../../../store/thunks/consolidated/scenesThunks');

      const resultAction = await dispatch(deleteSceneAndRefresh({
        sceneId: formattedSceneId,
        universeId: universeId
      }));

      if (deleteSceneAndRefresh.fulfilled.match(resultAction)) {
        console.log('SceneModal - Scene deleted successfully:', resultAction.payload);
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
  }, [formattedSceneId, universeId, dispatch, onClose, onSuccess]);

  // Memoize the scene data loading function
  const loadSceneData = useCallback(async () => {
    if (!formattedSceneId || initialData) return;

    try {
      setLoading(true);
      setError(null);

      console.log(`SceneModal - Loading scene data for ID: ${formattedSceneId}`);

      const { fetchSceneById } = await import('../../../store/thunks/consolidated/scenesThunks');
      const resultAction = await dispatch(fetchSceneById(formattedSceneId));

      if (fetchSceneById.fulfilled.match(resultAction)) {
        const sceneData = resultAction.payload;
        let processedSceneData;

        if (sceneData?.scene) {
          processedSceneData = sceneData.scene;
        } else if (sceneData && typeof sceneData === 'object') {
          processedSceneData = sceneData;
        } else {
          throw new Error('No valid scene data found in response');
        }

        processedSceneData.id = processedSceneData.id || formattedSceneId;
        if (universeId && !processedSceneData.universe_id) {
          processedSceneData.universe_id = universeId;
        }

        setScene(processedSceneData);
      } else {
        const errorMsg = resultAction.error?.message || 'Failed to fetch scene data';
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('SceneModal - Error loading scene data:', error);
      setError(`Failed to load scene data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [formattedSceneId, initialData, universeId, dispatch]);

  // Load scene data when needed
  useEffect(() => {
    if (isModalOpen && (actualMode === 'edit' || actualMode === 'view' || actualMode === 'delete')) {
      loadSceneData();
    }
  }, [isModalOpen, actualMode, loadSceneData]);

  // Handle modal mounting/unmounting
  useEffect(() => {
    if (isModalOpen) {
      // Delay showing content slightly to ensure modal is fully mounted
      const timer = setTimeout(() => {
        setIsContentMounted(true);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setIsContentMounted(false);
    }
  }, [isModalOpen]);

  // Memoize the content renderer to prevent unnecessary re-renders
  const renderContent = useCallback(() => {
    if (!isContentMounted) {
      return null;
    }

    if (loading) {
      return (
        <div className="scene-modal-loading">
          <div className="spinner" />
          <p>Loading scene data...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="scene-modal-error">
          <p className="error-message">{error}</p>
          <button onClick={() => setError(null)}>Try Again</button>
        </div>
      );
    }

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
            sceneId={formattedSceneId}
            initialData={scene || initialData}
            onSubmit={handleSubmit}
            onCancel={onClose}
          />
        );
      case 'view': {
        const sceneData = scene || initialData;
        if (!sceneData) {
          return (
            <div className="scene-modal-error">
              <p className="error-message">Scene data not found. Please try again.</p>
              <button onClick={onClose}>Close</button>
            </div>
          );
        }

        const viewerData = sceneData.scene ? sceneData.scene : sceneData;
        if (!viewerData.id) {
          return (
            <div className="scene-modal-error">
              <p className="error-message">Invalid scene data. Missing scene ID.</p>
              <button onClick={onClose}>Close</button>
            </div>
          );
        }

        return <SceneViewer scene={viewerData} onClose={onClose} />;
      }
      case 'delete': {
        if (!scene && !initialData) {
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
      }
      default:
        return <p>Invalid mode: {actualMode}</p>;
    }
  }, [actualMode, scene, initialData, loading, error, isContentMounted, formattedSceneId, universeId, onClose, handleSubmit, handleDelete]);

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
          height: '80vh',
          maxHeight: '90vh',
          width: '100%',
          maxWidth: '800px',
          overflow: 'hidden',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          WebkitFontSmoothing: 'subpixel-antialiased',
          display: 'flex',
          flexDirection: 'column',
        }
      }}
      TransitionProps={{
        timeout: 0,
      }}
      BackdropProps={{
        sx: {
          transition: 'none',
        }
      }}
      sx={{
        '& .MuiDialog-container': {
          transition: 'none',
        }
      }}
    >
      <DialogTitle id="scene-modal-title" sx={{
        padding: '16px 24px',
        borderBottom: '1px solid #f0f0f0',
        backgroundColor: '#fafafa'
      }}>
        {modalTitle}
      </DialogTitle>
      <DialogContent sx={{
        flex: 1,
        padding: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div className="scene-modal" style={{
          height: '100%',
          overflow: 'auto',
          padding: '24px'
        }}>
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
  universeId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  sceneId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  initialData: PropTypes.object,
  // Support both modalType and mode props
  modalType: PropTypes.oneOf(['create', 'edit', 'view', 'delete']),
  mode: PropTypes.oneOf(['create', 'edit', 'view', 'delete']),
};

export default SceneModal;
