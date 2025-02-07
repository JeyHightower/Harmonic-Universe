import { useGetModelQuery } from '@services/aiService';
import { RootState } from '@store/index';
import { updateModel } from '@store/slices/aiSlice';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

export interface Experiment {
  id: number;
  name: string;
  description: string;
  hyperparameters: {
    [key: string]: any;
  };
  metrics: {
    [key: string]: any;
  };
  status: string;
  start_time: number;
  end_time?: number;
  artifacts: {
    type: string;
    path: string;
    metadata: any;
  }[];
  tags: string[];
}

export const useModelExperiments = (modelId: number | null) => {
  const dispatch = useDispatch();
  const model = useSelector((state: RootState) => state.ai.models.find(m => m.id === modelId));
  const { data: modelData } = useGetModelQuery(modelId || 0, { skip: !modelId });

  // Create new experiment
  const createExperiment = useCallback(
    async (
      name: string,
      config: {
        description: string;
        hyperparameters: { [key: string]: any };
        tags?: string[];
      }
    ) => {
      if (!model) return null;

      try {
        dispatch(
          updateModel({
            id: model.id,
            experiments: [
              ...(modelData?.experiments || []),
              {
                id: Date.now(), // Temporary ID until backend responds
                name,
                ...config,
                status: 'created',
                start_time: Date.now(),
                metrics: {},
                artifacts: [],
              },
            ],
          })
        );
        return true;
      } catch (error) {
        console.error('Failed to create experiment:', error);
        return null;
      }
    },
    [model, dispatch, modelData]
  );

  // Start experiment
  const startExperiment = useCallback(
    async (experimentId: number) => {
      if (!model) return false;

      try {
        dispatch(
          updateModel({
            id: model.id,
            experiments: modelData?.experiments?.map(e =>
              e.id === experimentId ? { ...e, status: 'running' } : e
            ),
          })
        );
        return true;
      } catch (error) {
        console.error('Failed to start experiment:', error);
        return false;
      }
    },
    [model, dispatch, modelData]
  );

  // Stop experiment
  const stopExperiment = useCallback(
    async (experimentId: number) => {
      if (!model) return false;

      try {
        dispatch(
          updateModel({
            id: model.id,
            experiments: modelData?.experiments?.map(e =>
              e.id === experimentId ? { ...e, status: 'stopped', end_time: Date.now() } : e
            ),
          })
        );
        return true;
      } catch (error) {
        console.error('Failed to stop experiment:', error);
        return false;
      }
    },
    [model, dispatch, modelData]
  );

  // Delete experiment
  const deleteExperiment = useCallback(
    async (experimentId: number) => {
      if (!model) return false;

      try {
        dispatch(
          updateModel({
            id: model.id,
            experiments: modelData?.experiments?.filter(e => e.id !== experimentId),
          })
        );
        return true;
      } catch (error) {
        console.error('Failed to delete experiment:', error);
        return false;
      }
    },
    [model, dispatch, modelData]
  );

  return {
    createExperiment,
    startExperiment,
    stopExperiment,
    deleteExperiment,
    experiments: modelData?.experiments || [],
  };
};
