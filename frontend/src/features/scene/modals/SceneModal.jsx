import { Form } from 'antd';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import Spinner from '../../../components/common/Spinner.jsx';
import StableModalWrapper from '../../../components/modals/StableModalWrapper.jsx';
import '../../../styles/SceneFormModal.css';
import SceneViewer from '../components/SceneViewer';
import SceneForm from '../pages/SceneForm';
import SceneDeleteConfirmation from './SceneDeleteConfirmation';

/**
 * SceneModal component
 *
 * A unified modal for handling all scene operations: create, edit, view, and delete
 */
const SceneModal = React.forwardRef(
  ({
    // Props from consolidated component
    open,
    isOpen,
    onClose,
    onSuccess,
    universeId,
    sceneId,
    initialData = null,
    modalType = 'scene',
    mode = 'create',
  }) => {
    if (open) {
      console.log('SceneModal - COMPONENT INITIALIZED with open=true');
    }

    const isModalOpen = open; // Direct usage of the open prop
    const actualMode = mode || modalType;
    console.log('SceneModal - isModalOpen value:', isModalOpen);
    const [scene, setScene] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isContentMounted, setIsContentMounted] = useState(false);
    const dispatch = useDispatch();
    const [form] = Form.useForm();
    const viewerData = scene || initialData;

    useEffect(() => {
      console.log('SceneModal - open changed:', { open });
      if (open) {
        document.body.offsetHeight; // Trigger reflow
      }
    }, [open]);

    const modalTitle = useMemo(() => {
      const titles = {
        create: 'Create New Scene',
        edit: 'Edit Scene',
        view: 'View Scene',
        delete: 'Delete Scene',
      };
      return titles[actualMode] || 'Scene';
    }, [actualMode]);

    const formattedSceneId = useMemo(() => {
      if (sceneId == null) return null; // Handles both null and undefined
      return typeof sceneId === 'object' && 'id' in sceneId ? String(sceneId.id) : String(sceneId);
    }, [sceneId]);

    useEffect(() => {
      if (isModalOpen && sceneId && ['edit', 'view', 'delete'].includes(actualMode)) {
        console.log('SceneModal - Fetching scene data for:', sceneId);
        setLoading(true);
        const fetchSceneData = async () => {
          try {
            const { fetchSceneById } = await import('../../../store/thunks/scenesThunks');
            const result = await dispatch(fetchSceneById(formattedSceneId)).unwrap();
            setScene(result);
            console.log('SceneModal - Scene data fetched successfully');
          } catch (error) {
            console.error('SceneModal - Error fetching scene data:', error);
            setError(error.message || 'Failed to load scene data');
          } finally {
            setLoading(false);
          }
        };
        fetchSceneData();
      }
    }, [dispatch, isModalOpen, sceneId, actualMode, formattedSceneId]);

    const handleSubmit = useCallback(
      async (formData) => {
        try {
          if (loading) {
            console.log('SceneModal - Submission already in progress, ignoring duplicate submit');
            return;
          }

          setLoading(true);
          setError(null);
          const requestId = `scene_submit_${Date.now()}`;
          console.log(`SceneModal [${requestId}] - Processing form submission`);

          const { createSceneAndRefresh, updateSceneAndRefresh } = await import(
            '../../../store/thunks/scenesThunks'
          );

          // Handle date formatting properly
          let formattedDate = null;
          if (formData.dateOfScene) {
            if (typeof formData.dateOfScene === 'object' && formData.dateOfScene.format) {
              // It's a moment.js or dayjs object
              formattedDate = formData.dateOfScene.format('YYYY-MM-DD');
            } else if (typeof formData.dateOfScene === 'string') {
              // It's already a string
              formattedDate = formData.dateOfScene;
            } else if (formData.dateOfScene instanceof Date) {
              // It's a Date object
              formattedDate = formData.dateOfScene.toISOString().split('T')[0];
            }
          }

          const sceneData = {
            ...formData,
            universe_id: universeId,
            is_deleted: false,
            date_of_scene: formattedDate,
          };

          const action =
            actualMode === 'create'
              ? createSceneAndRefresh(sceneData)
              : updateSceneAndRefresh({ sceneId: formattedSceneId, sceneData });

          const resultAction = await dispatch(action).unwrap();
          console.log(
            `SceneModal [${requestId}] - Scene ${actualMode}d successfully:`,
            resultAction
          );
          if (onSuccess) onSuccess(resultAction);
          onClose();
        } catch (error) {
          console.error('SceneModal - Error submitting scene data:', error);
          setError(`Failed to save scene: ${error.message}`);
        } finally {
          setLoading(false);
        }
      },
      [actualMode, formattedSceneId, universeId, dispatch, loading, onClose, onSuccess]
    );

    const handleDelete = useCallback(async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('SceneModal - Deleting scene with ID:', formattedSceneId);

        const { deleteSceneAndRefresh } = await import('../../../store/thunks/scenesThunks');
        const resultAction = await dispatch(
          deleteSceneAndRefresh({ sceneId: formattedSceneId, universeId })
        ).unwrap();

        console.log('SceneModal - Scene deleted successfully:', resultAction);
        if (onSuccess) onSuccess(resultAction);
        onClose();
      } catch (error) {
        console.error('SceneModal - Error deleting scene:', error);
        setError(`Failed to delete scene: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }, [formattedSceneId, universeId, dispatch, onClose, onSuccess]);

    const loadSceneData = useCallback(async () => {
      if (!formattedSceneId || initialData) return;

      try {
        setLoading(true);
        setError(null);
        console.log(`SceneModal - Loading scene data for ID: ${formattedSceneId}`);

        const { fetchSceneById } = await import('../../../store/thunks/scenesThunks');
        const resultAction = await dispatch(fetchSceneById(formattedSceneId)).unwrap();

        const sceneData = resultAction.scene || resultAction;
        if (!sceneData) throw new Error('No valid scene data found in response');

        setScene({
          ...sceneData,
          id: sceneData.id || formattedSceneId,
          universe_id: universeId || sceneData.universe_id,
        });
      } catch (error) {
        console.error('SceneModal - Error loading scene data:', error);
        setError(`Failed to load scene data: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }, [formattedSceneId, initialData, universeId, dispatch]);

    useEffect(() => {
      if (isModalOpen && ['edit', 'view', 'delete'].includes(actualMode)) {
        loadSceneData();
      }
    }, [isModalOpen, actualMode, loadSceneData]);

    useEffect(() => {
      if (isModalOpen) {
        setIsContentMounted(true);
      } else {
        setIsContentMounted(false);
      }
    }, [isModalOpen]);

    const renderContent = useCallback(() => {
      // Remove the isContentMounted check to ensure content renders immediately

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
        case 'edit':
          return (
            <SceneForm
              form={form}
              universeId={universeId}
              sceneId={actualMode === 'edit' ? formattedSceneId : undefined}
              initialData={actualMode === 'edit' ? scene || initialData : undefined}
              onSubmit={handleSubmit}
              onCancel={onClose}
            />
          );
        case 'view':
          if (!viewerData || !viewerData.id) {
            return (
              <div className="scene-modal-error">
                <p className="error-message">Invalid scene data. Please try again.</p>
                <button onClick={onClose}>Close</button>
              </div>
            );
          }
          return <SceneViewer scene={viewerData} onClose={onClose} />;
        case 'delete':
          return (
            <SceneDeleteConfirmation
              scene={scene}
              onDelete={handleDelete}
              onCancel={onClose}
              isLoading={loading}
            />
          );
        default:
          return <p>Invalid mode: {actualMode}</p>;
      }
    }, [
      isContentMounted,
      loading,
      error,
      actualMode,
      form,
      universeId,
      formattedSceneId,
      scene,
      initialData,
      handleSubmit,
      onClose,
      viewerData,
      handleDelete,
    ]);

    if (open) {
      console.log('SceneModal - About to render StableModalWrapper with open=true');
    }
    return (
      <StableModalWrapper
        title={modalTitle}
        open={open}
        onClose={onClose}
        width={800}
        footer={null}
      >
        <div
          className="scene-form-container scene-modal-content"
          style={{ padding: '24px', maxHeight: 'calc(80vh - 130px)', overflow: 'auto' }}
        >
          {renderContent()}
        </div>
      </StableModalWrapper>
    );
  }
);

SceneModal.propTypes = {
  open: PropTypes.bool, // No longer required, defaults to false
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  universeId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  sceneId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  initialData: PropTypes.object,
  modalType: PropTypes.oneOf(['create', 'edit', 'view', 'delete']),
  mode: PropTypes.oneOf(['create', 'edit', 'view', 'delete']),
};

SceneModal.displayName = 'SceneModal';

export default SceneModal;
