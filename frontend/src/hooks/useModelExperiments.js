import { useGetModelQuery } from '@services/aiService';
import { RootState } from '@store/index';
import { updateModel } from '@store/slices/aiSlice';
import { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

export interface Experiment {
  id: number;
  name: string;
  description: string;
  status: string;
  config: {
    hyperparameters: { [key: string]: any };
    tags?: string[];
  };
  metrics?: { [key: string]: any };
  error?: string;
}

export interface ModelExperiments {
  experiments: Experiment[];
  createExperiment: (data: Partial) => Promise;
  updateExperiment: (id: number, data: Partial) => Promise;
  deleteExperiment: (id: number) => Promise;
  loading: boolean;
  error: string | null;
}

export const useModelExperiments = (modelId: number | null): ModelExperiments => {
  const dispatch = useDispatch();
  const model = useSelector((state: RootState) => state.ai.models.find(m => m.id === modelId));
  const { data: modelData } = useGetModelQuery(modelId || 0, { skip: !modelId });
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createExperiment = useCallback(
    async (data: Partial) => {
      try {
        setLoading(true);
        setError(null);
        if (!model) return;

        try {
          dispatch(
            updateModel({
              id: model.id,
              experiments: [
                ...(modelData?.experiments || []),
                {
                  id: Date.now(), // Temporary ID until backend responds
                  name: data.name || '',
                  description: data.description || '',
                  status: 'created',
                  config: data.config || { hyperparameters: {} },
                },
              ],
            })
          );
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to create experiment');
        }
      } finally {
        setLoading(false);
      }
    },
    [model, dispatch, modelData]
  );

  const updateExperiment = useCallback(
    async (id: number, data: Partial) => {
      try {
        setLoading(true);
        setError(null);
        if (!model) return;

        try {
          dispatch(
            updateModel({
              id: model.id,
              experiments: modelData?.experiments?.map(e => (e.id === id ? { ...e, ...data } : e)),
            })
          );
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to update experiment');
        }
      } finally {
        setLoading(false);
      }
    },
    [model, dispatch, modelData]
  );

  const deleteExperiment = useCallback(
    async (id: number) => {
      try {
        setLoading(true);
        setError(null);
        if (!model) return;

        try {
          dispatch(
            updateModel({
              id: model.id,
              experiments: modelData?.experiments?.filter(e => e.id !== id),
            })
          );
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to delete experiment');
        }
      } finally {
        setLoading(false);
      }
    },
    [model, dispatch, modelData]
  );

  return {
    experiments: modelData?.experiments || [],
    createExperiment,
    updateExperiment,
    deleteExperiment,
    loading,
    error,
  };
};
