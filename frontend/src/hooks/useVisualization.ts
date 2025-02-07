import {
  createVisualization,
  deleteVisualization,
  fetchVisualization,
  fetchVisualizations,
  selectCurrentVisualization,
  selectIsRealTime,
  selectUpdateInterval,
  selectVisualizationError,
  selectVisualizationLoading,
  selectVisualizations,
  setUpdateInterval,
  startRealTime,
  stopRealTime,
  updateVisualization,
} from '@/store/slices/visualizationSlice';
import { AppDispatch } from '@/store/store';
import { VisualizationFormData, VisualizationUpdateData } from '@/types/visualization';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

export const useVisualization = (projectId: number) => {
  const dispatch = useDispatch<AppDispatch>();
  const visualizations = useSelector(selectVisualizations);
  const currentVisualization = useSelector(selectCurrentVisualization);
  const loading = useSelector(selectVisualizationLoading);
  const error = useSelector(selectVisualizationError);
  const isRealTime = useSelector(selectIsRealTime);
  const updateInterval = useSelector(selectUpdateInterval);

  const handleFetchVisualizations = useCallback(async () => {
    await dispatch(fetchVisualizations(projectId));
  }, [dispatch, projectId]);

  const handleFetchVisualization = useCallback(
    async (visualizationId: number) => {
      await dispatch(fetchVisualization({ projectId, visualizationId }));
    },
    [dispatch, projectId]
  );

  const handleCreateVisualization = useCallback(
    async (data: VisualizationFormData) => {
      await dispatch(createVisualization({ projectId, data }));
    },
    [dispatch, projectId]
  );

  const handleUpdateVisualization = useCallback(
    async (visualizationId: number, data: VisualizationUpdateData) => {
      await dispatch(updateVisualization({ projectId, visualizationId, data }));
    },
    [dispatch, projectId]
  );

  const handleDeleteVisualization = useCallback(
    async (visualizationId: number) => {
      await dispatch(deleteVisualization({ projectId, visualizationId }));
    },
    [dispatch, projectId]
  );

  const handleSetUpdateInterval = useCallback(
    (interval: number) => {
      dispatch(setUpdateInterval(interval));
    },
    [dispatch]
  );

  const handleStartRealTime = useCallback(() => {
    dispatch(startRealTime());
  }, [dispatch]);

  const handleStopRealTime = useCallback(() => {
    dispatch(stopRealTime());
  }, [dispatch]);

  return {
    visualizations,
    currentVisualization,
    loading,
    error,
    isRealTime,
    updateInterval,
    fetchVisualizations: handleFetchVisualizations,
    fetchVisualization: handleFetchVisualization,
    createVisualization: handleCreateVisualization,
    updateVisualization: handleUpdateVisualization,
    deleteVisualization: handleDeleteVisualization,
    setUpdateInterval: handleSetUpdateInterval,
    startRealTime: handleStartRealTime,
    stopRealTime: handleStopRealTime,
  };
};
