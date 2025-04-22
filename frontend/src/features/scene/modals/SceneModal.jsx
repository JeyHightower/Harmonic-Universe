import { Form } from 'antd';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import Spinner from '../../../components/common/Spinner';
import StableModalWrapper from '../../../components/modals/StableModalWrapper';
import '../../../styles/SceneFormModal.css';
import SceneViewer from '../components/SceneViewer';
import SceneForm from '../pages/SceneForm';
import SceneDeleteConfirmation from './SceneDeleteConfirmation';

/**
 * SceneModal component
 *
 * A unified modal for handling all scene operations: create, edit, view, and delete
 * Replaces the consolidated SceneModalComponent with a more modular approach
 */
const SceneModal = React.forwardRef((
  {
    // Props from consolidated component
    open = false,
    isOpen = false,
    onClose,
    onSuccess,
    universeId,
    sceneId,
    initialData = null,
    // Support both modalType and mode props for backward compatibility
    modalType = 'scene',
    mode = 'create',
  },
  ref
) => {
  // Enhanced debug logging on component init
  console.log('SceneModal - COMPONENT INITIALIZED', {
    componentName: 'SceneModal',
    open,
    isOpen,
    universeId,
    mode,
    modalType
  });

  // For backward compatibility with both open and isOpen props
  const isModalOpen = useMemo(() => {
    const result = open || isOpen || false;
    console.log('SceneModal - isModalOpen calculated:', result);
    return result;
  }, [open, isOpen]);

  // Enhanced debugging
  console.log('SceneModal - Component initialized with props:', {
    open,
    isOpen,
    isModalOpen,
    universeId,
    sceneId,
    modalType,
    mode,
    initialData: initialData ? 'Has initial data' : 'No initial data'
  });

  // Support both modalType and mode props for backward compatibility
  const actualMode = mode || modalType;

  const [scene, setScene] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isContentMounted, setIsContentMounted] = useState(false);
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  // Add effect to log when modal should be visible
  useEffect(() => {
    console.log('SceneModal - isModalOpen changed:', { isModalOpen });

    if (isModalOpen) {
      console.log('SceneModal - Modal should be visible now');
      // Force a layout calculation by reading a property that causes reflow
      document.body.offsetHeight;
    }
  }, [isModalOpen]);

  // Memoize modal title to prevent re-renders
  const modalTitle = useMemo(() => {
    const titles = {
      create: 'Create New Scene',
      edit: 'Edit Scene',
      view: 'View Scene',
      delete: 'Delete Scene',
    };
    return titles[actualMode] || 'Scene';
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

  // Fetch scene data when editing, viewing, or deleting an existing scene
  useEffect(() => {
    if (isModalOpen && sceneId && ['edit', 'view', 'delete'].includes(actualMode)) {
      console.log('SceneModal - Fetching scene data for:', sceneId);
      setLoading(true);

      const fetchSceneData = async () => {
        try {
          const { fetchSceneById } = await import('../../../store/thunks/consolidated/scenesThunks');
          const result = await dispatch(fetchSceneById(sceneId)).unwrap();
          setLoading(false);
          console.log('SceneModal - Scene data fetched successfully');
        } catch (error) {
          console.error('SceneModal - Error fetching scene data:', error);
          setLoading(false);
          setError(error.message || 'Failed to load scene data');
        }
      };

      fetchSceneData();
    }
  }, [dispatch, isModalOpen, sceneId, actualMode]);

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
          <Spinner />
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
            form={form}
            universeId={universeId}
            onSubmit={handleSubmit}
            onCancel={onClose}
          />
        );
      case 'edit':
        return (
          <SceneForm
            form={form}
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
  }, [actualMode, scene, initialData, loading, error, isContentMounted, formattedSceneId, universeId, onClose, handleSubmit, handleDelete, form]);

  // Add debug log before rendering
  console.log('SceneModal - About to render with:', {
    isModalOpen,
    modalTitle,
    contentMounted: isContentMounted,
    hasError: !!error,
    mode: actualMode
  });

  // Main modal rendering
  const modalContent = (() => {
    if (!isContentMounted) {
      return null;
    }

    if (loading) {
      return (
        <div className="scene-modal-loading">
          <Spinner />
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
            form={form}
            universeId={universeId}
            onSubmit={handleSubmit}
            onCancel={onClose}
          />
        );
      case 'edit':
        return (
          <SceneForm
            form={form}
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
  })();

  // Final modal component (using StableModalWrapper with explicit open prop)
  return (
    <StableModalWrapper
      title={modalTitle}
      open={isModalOpen}
      onClose={onClose}
      width={800}
      style={{
        display: isModalOpen ? 'block' : 'none',
        visibility: isModalOpen ? 'visible' : 'hidden'
      }}
      footer={null}
    >
      <div className="scene-form-container scene-modal-content" style={{
        padding: '24px',
        maxHeight: 'calc(80vh - 130px)',
        overflow: 'auto'
      }}>
        {modalContent}
      </div>
    </StableModalWrapper>
  );
});

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

SceneModal.displayName = 'SceneModal';

export default SceneModal;
