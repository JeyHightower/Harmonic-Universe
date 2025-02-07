import { AppDispatch } from '@/store';
import {
  createVisualization,
  deleteVisualization,
  selectCurrentVisualization,
  selectVisualizationError,
  selectVisualizationLoading,
  selectVisualizations,
  setCurrentVisualization,
  updateDataMappings,
  updateStreamConfig,
  updateVisualization,
} from '@/store/slices/visualizationSlice';
import {
  DataMapping,
  StreamConfig,
  Visualization,
  VisualizationFormData,
  VisualizationUpdateData,
} from '@/types/visualization';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

interface UseVisualizationProps {
  projectId: number;
  audioId?: number;
}

export const useVisualization = ({ projectId, audioId }: UseVisualizationProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const visualizations = useSelector(selectVisualizations);
  const currentVisualization = useSelector(selectCurrentVisualization);
  const loading = useSelector(selectVisualizationLoading);
  const error = useSelector(selectVisualizationError);

  const create = useCallback(
    async (data: VisualizationFormData) => {
      if (!audioId) {
        throw new Error('Audio ID is required to create a visualization');
      }
      try {
        const resultAction = await dispatch(createVisualization({ projectId, audioId, data }));
        if (createVisualization.fulfilled.match(resultAction)) {
          return resultAction.payload;
        }
      } catch (error) {
        console.error('Failed to create visualization:', error);
        throw error;
      }
    },
    [dispatch, projectId, audioId]
  );

  const update = useCallback(
    async (id: number, data: VisualizationUpdateData) => {
      try {
        const resultAction = await dispatch(updateVisualization({ id, data }));
        if (updateVisualization.fulfilled.match(resultAction)) {
          return resultAction.payload;
        }
      } catch (error) {
        console.error('Failed to update visualization:', error);
        throw error;
      }
    },
    [dispatch]
  );

  const remove = useCallback(
    async (id: number) => {
      try {
        await dispatch(deleteVisualization(id));
      } catch (error) {
        console.error('Failed to delete visualization:', error);
        throw error;
      }
    },
    [dispatch]
  );

  const updateMappings = useCallback(
    async (id: number, dataMappings: DataMapping[]) => {
      try {
        const resultAction = await dispatch(updateDataMappings({ id, dataMappings }));
        if (updateDataMappings.fulfilled.match(resultAction)) {
          return resultAction.payload;
        }
      } catch (error) {
        console.error('Failed to update data mappings:', error);
        throw error;
      }
    },
    [dispatch]
  );

  const updateConfig = useCallback(
    async (id: number, streamConfig: StreamConfig) => {
      try {
        const resultAction = await dispatch(updateStreamConfig({ id, streamConfig }));
        if (updateStreamConfig.fulfilled.match(resultAction)) {
          return resultAction.payload;
        }
      } catch (error) {
        console.error('Failed to update stream config:', error);
        throw error;
      }
    },
    [dispatch]
  );

  const setCurrent = useCallback(
    (visualization: Visualization | null) => {
      dispatch(setCurrentVisualization(visualization));
    },
    [dispatch]
  );

  return {
    visualizations,
    currentVisualization,
    loading,
    error,
    create,
    update,
    remove,
    updateMappings,
    updateConfig,
    setCurrent,
  };
};
