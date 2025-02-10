import { useNotification } from '@/components/common/Notification';
import {
  createVisualization,
  deleteVisualization,
  fetchVisualization,
  fetchVisualizations,
  selectCurrentVisualization,
  selectVisualizationError,
  selectVisualizationLoading,
  selectVisualizations,
  updateVisualization,
} from '@/store/slices/visualizationSlice';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

export const useVisualization = () => {
  const dispatch = useDispatch();
  const { showNotification } = useNotification();
  const visualizations = useSelector(selectVisualizations);
  const currentVisualization = useSelector(selectCurrentVisualization);
  const error = useSelector(selectVisualizationError);
  const loading = useSelector(selectVisualizationLoading);

  const handleFetchVisualizations = useCallback(
    async projectId => {
      try {
        await dispatch(fetchVisualizations(projectId)).unwrap();
        return true;
      } catch (error) {
        showNotification(
          error.message || 'Failed to fetch visualizations',
          'error'
        );
        return false;
      }
    },
    [dispatch, showNotification]
  );

  const handleFetchVisualization = useCallback(
    async id => {
      try {
        await dispatch(fetchVisualization(id)).unwrap();
        return true;
      } catch (error) {
        showNotification(
          error.message || 'Failed to fetch visualization',
          'error'
        );
        return false;
      }
    },
    [dispatch, showNotification]
  );

  const handleCreateVisualization = useCallback(
    async ({ projectId, data }) => {
      try {
        const visualization = await dispatch(
          createVisualization({ projectId, data })
        ).unwrap();
        showNotification('Visualization created successfully', 'success');
        return visualization;
      } catch (error) {
        showNotification(
          error.message || 'Failed to create visualization',
          'error'
        );
        return null;
      }
    },
    [dispatch, showNotification]
  );

  const handleUpdateVisualization = useCallback(
    async ({ id, data }) => {
      try {
        await dispatch(updateVisualization({ id, data })).unwrap();
        showNotification('Visualization updated successfully', 'success');
        return true;
      } catch (error) {
        showNotification(
          error.message || 'Failed to update visualization',
          'error'
        );
        return false;
      }
    },
    [dispatch, showNotification]
  );

  const handleDeleteVisualization = useCallback(
    async id => {
      try {
        await dispatch(deleteVisualization(id)).unwrap();
        showNotification('Visualization deleted successfully', 'success');
        return true;
      } catch (error) {
        showNotification(
          error.message || 'Failed to delete visualization',
          'error'
        );
        return false;
      }
    },
    [dispatch, showNotification]
  );

  return {
    visualizations,
    currentVisualization,
    loading,
    error,
    fetchVisualizations: handleFetchVisualizations,
    fetchVisualization: handleFetchVisualization,
    createVisualization: handleCreateVisualization,
    updateVisualization: handleUpdateVisualization,
    deleteVisualization: handleDeleteVisualization,
  };
};
