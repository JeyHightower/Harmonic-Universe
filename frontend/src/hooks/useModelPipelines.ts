import { useGetModelQuery } from '@services/aiService';
import { RootState } from '@store/index';
import { updateModel } from '@store/slices/aiSlice';
import { useCallback } from 'react';
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
  stages: PipelineStage[];
  status: string;
  created_at: number;
  updated_at: number;
  metrics?: {
    [key: string]: any;
  };
}

export const useModelPipelines = (modelId: number | null) => {
  const dispatch = useDispatch();
  const model = useSelector((state: RootState) => state.ai.models.find(m => m.id === modelId));
  const { data: modelData } = useGetModelQuery(modelId || 0, { skip: !modelId });

  // Create new pipeline
  const createPipeline = useCallback(
    async (
      name: string,
      config: {
        description: string;
        stages: Omit<PipelineStage, 'id' | 'status' | 'metrics'>[];
      }
    ) => {
      if (!model) return null;

      try {
        dispatch(
          updateModel({
            id: model.id,
            pipelines: [
              ...(modelData?.pipelines || []),
              {
                id: Date.now(), // Temporary ID until backend responds
                name,
                ...config,
                status: 'created',
                created_at: Date.now(),
                updated_at: Date.now(),
              },
            ],
          })
        );
        return true;
      } catch (error) {
        console.error('Failed to create pipeline:', error);
        return null;
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
    async (pipelineId: number, stageId: number, updates: Partial<PipelineStage>) => {
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
                      updated_at: Date.now(),
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
      if (!model) return false;

      try {
        dispatch(
          updateModel({
            id: model.id,
            pipelines: modelData?.pipelines?.filter(p => p.id !== pipelineId),
          })
        );
        return true;
      } catch (error) {
        console.error('Failed to delete pipeline:', error);
        return false;
      }
    },
    [model, dispatch, modelData]
  );

  return {
    createPipeline,
    startPipeline,
    stopPipeline,
    getPipelineDetails,
    updatePipelineStage,
    getPipelineMetrics,
    deletePipeline,
    pipelines: modelData?.pipelines || [],
  };
};
