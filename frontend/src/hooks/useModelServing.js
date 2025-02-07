import { useGetModelQuery } from '@services/aiService';
import { RootState } from '@store/index';
import { updateModel } from '@store/slices/aiSlice';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

export interface ServingMetrics {
  timestamp: number;
  requests: {
    total: number;
    successful: number;
    failed: number;
    latency_ms: {
      p50: number;
      p95: number;
      p99: number;
    };
  };
  resources: {
    cpu_usage: number;
    memory_usage: number;
    gpu_usage?: number;
  };
  errors: {
    type: string;
    count: number;
    message: string;
  }[];
}

export interface ModelDeployment {
  id: number;
  status: 'pending' | 'running' | 'stopped' | 'failed';
  endpoint: string | null;
  version: string;
  resources: {
    cpu: number;
    memory: number;
    gpu?: number;
  };
  metrics?: {
    requestCount: number;
    errorRate: number;
    latency: number;
    throughput: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ModelServing {
  deployments: ModelDeployment[];
  createDeployment: (data: Partial) => Promise;
  updateDeployment: (id: number, data: Partial) => Promise;
  deleteDeployment: (id: number) => Promise;
  loading: boolean;
  error: string | null;
}

export const useModelServing = (modelId: number | null): ModelServing => {
  const dispatch = useDispatch();
  const model = useSelector((state: RootState) => state.ai.models.find(m => m.id === modelId));
  const { data: modelData } = useGetModelQuery(modelId || 0, { skip: !modelId });
  const metricsRef = useRef<{
    interval: NodeJS.Timeout | null;
    metrics: ServingMetrics[];
  }>({
    interval: null,
    metrics: [],
  });
  const [deployments, setDeployments] = useState<ModelDeployment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Start collecting serving metrics
  const startMetricsCollection = useCallback(() => {
    if (!model) return;

    // Set up polling for metrics
    metricsRef.current.interval = setInterval(async () => {
      if (modelData?.serving?.latest_metrics) {
        metricsRef.current.metrics = [
          ...metricsRef.current.metrics.slice(-59),
          modelData.serving.latest_metrics,
        ];

        dispatch(
          updateModel({
            id: model.id,
            serving: {
              ...(model.serving || {}),
              latest_metrics: modelData.serving.latest_metrics,
              metrics_history: metricsRef.current.metrics,
            },
          })
        );
      }
    }, 1000); // Poll every second
  }, [model, dispatch, modelData]);

  // Stop collecting metrics
  const stopMetricsCollection = useCallback(() => {
    if (metricsRef.current.interval) {
      clearInterval(metricsRef.current.interval);
      metricsRef.current.interval = null;
    }
  }, []);

  // Get serving configuration
  const getServingConfig = useCallback(async () => {
    if (!model) return null;

    try {
      const response = await api.get(`/ai/models/${model.id}/serving/config`);
      if (response.ok) {
        return response.data;
      }
    } catch (error) {
      console.error('Failed to get serving configuration:', error);
    }
    return null;
  }, [model]);

  // Update serving configuration
  const updateServingConfig = useCallback(
    async (config: {
      batch_size?: number;
      timeout_ms?: number;
      max_batch_latency_ms?: number;
      cache_size?: number;
      enable_optimization?: boolean;
    }) => {
      if (!model) return false;

      try {
        const response = await api.patch(`/ai/models/${model.id}/serving/config`, config);
        if (response.ok) {
          dispatch(
            updateModel({
              id: model.id,
              serving: {
                ...(model.serving || {}),
                config: {
                  ...model.serving?.config,
                  ...config,
                },
              },
            })
          );
          return true;
        }
      } catch (error) {
        console.error('Failed to update serving configuration:', error);
      }
      return false;
    },
    [model, dispatch]
  );

  // Get serving logs
  const getServingLogs = useCallback(async () => {
    if (!model) return [];

    try {
      const response = await api.get(`/ai/models/${model.id}/serving/logs`);
      if (response.ok) {
        return response.data;
      }
    } catch (error) {
      console.error('Failed to get serving logs:', error);
    }
    return [];
  }, [model]);

  // Test endpoint
  const testEndpoint = useCallback(
    async (input: any) => {
      if (!model?.deployment?.endpoint) return null;

      try {
        const response = await api.post(`${model.deployment.endpoint}/predict`, {
          input,
        });
        if (response.ok) {
          return response.data;
        }
      } catch (error) {
        console.error('Failed to test endpoint:', error);
      }
      return null;
    },
    [model]
  );

  // Get endpoint health
  const getEndpointHealth = useCallback(async () => {
    if (!model?.deployment?.endpoint) return null;

    try {
      const response = await api.get(`${model.deployment.endpoint}/health`);
      if (response.ok) {
        return response.data;
      }
    } catch (error) {
      console.error('Failed to get endpoint health:', error);
    }
    return null;
  }, [model]);

  const createDeployment = useCallback(async (data: Partial) => {
    try {
      setLoading(true);
      setError(null);
      // API call would go here
      const newDeployment: ModelDeployment = {
        id: Math.random(),
        status: 'pending',
        endpoint: null,
        version: data.version || '1.0.0',
        resources: data.resources || { cpu: 1, memory: 1024 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setDeployments(prev => [...prev, newDeployment]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create deployment');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateDeployment = useCallback(async (id: number, data: Partial) => {
    try {
      setLoading(true);
      setError(null);
      // API call would go here
      setDeployments(prev =>
        prev.map(deployment =>
          deployment.id === id
            ? { ...deployment, ...data, updatedAt: new Date().toISOString() }
            : deployment
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update deployment');
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteDeployment = useCallback(async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      // API call would go here
      setDeployments(prev => prev.filter(deployment => deployment.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete deployment');
    } finally {
      setLoading(false);
    }
  }, []);

  // Cleanup on unmount or model change
  useEffect(() => {
    return () => {
      stopMetricsCollection();
    };
  }, [model, stopMetricsCollection]);

  return {
    deployments,
    createDeployment,
    updateDeployment,
    deleteDeployment,
    loading,
    error,
    startMetricsCollection,
    stopMetricsCollection,
    isCollectingMetrics: !!metricsRef.current.interval,
    getServingConfig,
    updateServingConfig,
    getServingLogs,
    testEndpoint,
    getEndpointHealth,
    metrics: metricsRef.current.metrics,
    latestMetrics: model?.serving?.latest_metrics,
    config: model?.serving?.config,
  };
};
