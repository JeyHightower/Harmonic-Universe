import { useGetModelQuery } from '@services/aiService';
import { RootState } from '@store/index';
import { updateModel } from '@store/slices/aiSlice';
import { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

export interface PipelineStage {
  id: number;
  name: string;
  type: string;
  config: {
    [key: string]: any;
  };
  inputs: {
    source: string;
    field: string;
  }[];
  outputs: {
    name: string;
    type: string;
  }[];
  status: string;
  metrics?: {
    [key: string]: any;
  };
}

export interface Pipeline {
  id: number;
  name: string;
  description: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  stages: Array<{
    id: number;
    name: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    progress: number;
    error?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ModelPipelines {
  pipelines: Pipeline[];
  createPipeline: (data: Partial) => Promise;
  updatePipeline: (id: number, data: Partial) => Promise;
  deletePipeline: (id: number) => Promise;
  loading: boolean;
  error: string | null;
}

export const useModelPipelines = (modelId: number | null): ModelPipelines => {
  const dispatch = useDispatch();
  const model = useSelector((state: RootState) => state.ai.models.find(m => m.id === modelId));
  const { data: modelData } = useGetModelQuery(modelId || 0, { skip: !modelId });
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create new pipeline
  const createPipeline = useCallback(
    async (data: Partial) => {
      try {
        setLoading(true);
        setError(null);
        if (!model) return;

        try {
          dispatch(
            updateModel({
              id: model.id,
              pipelines: [
                ...(modelData?.pipelines || []),
                {
                  id: Date.now(), // Temporary ID until backend responds
                  name: data.name || '',
                  description: data.description || '',
                  status: 'idle',
                  stages: [],
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
              ],
            })
          );
          setPipelines(prev => [
            ...prev,
            {
              id: Date.now(),
              name: data.name || '',
              description: data.description || '',
              status: 'idle',
              stages: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ]);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to create pipeline');
        }
      } finally {
        setLoading(false);
      }
    },
    [model, dispatch, modelData]
  );

  // Start pipeline
  const startPipeline = useCallback(
    async (pipelineId: number) => {
      if (!model) return false;

      try {
        dispatch(
          updateModel({
            id: model.id,
            pipelines: modelData?.pipelines?.map(p =>
              p.id === pipelineId ? { ...p, status: 'running' } : p
            ),
          })
        );
        return true;
      } catch (error) {
        console.error('Failed to start pipeline:', error);
        return false;
      }
    },
    [model, dispatch, modelData]
  );

  // Stop pipeline
  const stopPipeline = useCallback(
    async (pipelineId: number) => {
      if (!model) return false;

      try {
        dispatch(
          updateModel({
            id: model.id,
            pipelines: modelData?.pipelines?.map(p =>
              p.id === pipelineId ? { ...p, status: 'stopped' } : p
            ),
          })
        );
        return true;
      } catch (error) {
        console.error('Failed to stop pipeline:', error);
        return false;
      }
    },
    [model, dispatch, modelData]
  );

  // Get pipeline details
  const getPipelineDetails = useCallback(
    async (pipelineId: number) => {
      if (!model) return null;

      try {
        const response = await api.get(`/ai/models/${model.id}/pipelines/${pipelineId}`);
        if (response.ok) {
          return response.data;
        }
      } catch (error) {
        console.error('Failed to get pipeline details:', error);
      }
      return null;
    },
    [model]
  );

  // Update pipeline stage
  const updatePipelineStage = useCallback(
    async (pipelineId: number, stageId: number, updates: Partial) => {
      if (!model) return false;

      try {
        const response = await api.patch(
          `/ai/models/${model.id}/pipelines/${pipelineId}/stages/${stageId}`,
          updates
        );
        if (response.ok) {
          dispatch(
            updateModel({
              id: model.id,
              pipelines: model.pipelines?.map(p =>
                p.id === pipelineId
                  ? {
                      ...p,
                      stages: p.stages.map(s => (s.id === stageId ? { ...s, ...updates } : s)),
                      updatedAt: Date.now(),
                    }
                  : p
              ),
            })
          );
          return true;
        }
      } catch (error) {
        console.error('Failed to update pipeline stage:', error);
      }
      return false;
    },
    [model, dispatch]
  );

  // Get pipeline metrics
  const getPipelineMetrics = useCallback(
    async (pipelineId: number) => {
      if (!model) return null;

      try {
        const response = await api.get(`/ai/models/${model.id}/pipelines/${pipelineId}/metrics`);
        if (response.ok) {
          return response.data;
        }
      } catch (error) {
        console.error('Failed to get pipeline metrics:', error);
      }
      return null;
    },
    [model]
  );

  // Delete pipeline
  const deletePipeline = useCallback(
    async (pipelineId: number) => {
      try {
        setLoading(true);
        setError(null);
        if (!model) return;

        try {
          dispatch(
            updateModel({
              id: model.id,
              pipelines: modelData?.pipelines?.filter(p => p.id !== pipelineId),
            })
          );
          setPipelines(prev => prev.filter(p => p.id !== pipelineId));
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to delete pipeline');
        }
      } finally {
        setLoading(false);
      }
    },
    [model, dispatch, modelData]
  );

  return {
    pipelines,
    createPipeline,
    startPipeline,
    stopPipeline,
    getPipelineDetails,
    updatePipelineStage,
    getPipelineMetrics,
    deletePipeline,
    loading,
    error,
  };
};
