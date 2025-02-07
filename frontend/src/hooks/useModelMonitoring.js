import { useGetModelQuery } from '@services/aiService';
import { RootState } from '@store/index';
import { updateModel } from '@store/slices/aiSlice';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

export interface ModelMetrics {
  accuracy: number;
  loss: number;
  precision: number;
  recall: number;
  f1Score: number;
  timestamp: number;
}

export interface ModelMonitoring {
  metrics: ModelMetrics[];
  addMetrics: (metrics: ModelMetrics) => void;
  clearMetrics: () => void;
  loading: boolean;
  error: string | null;
}

export const useModelMonitoring = (modelId: number | null): ModelMonitoring => {
  const dispatch = useDispatch();
  const model = useSelector((state: RootState) => state.ai.models.find(m => m.id === modelId));
  const { data: modelData } = useGetModelQuery(modelId || 0, { skip: !modelId });
  const monitoringRef = useRef<{
    socket: WebSocket | null;
    interval: NodeJS.Timeout | null;
  }>({ socket: null, interval: null });
  const [metrics, setMetrics] = useState<ModelMetrics[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize monitoring WebSocket
  const initMonitoring = useCallback(() => {
    if (!model) return;

    const socket = new WebSocket(`${process.env.VITE_WS_URL}/ai/monitoring/${model.id}`);

    socket.onmessage = event => {
      const metrics = JSON.parse(event.data);
      dispatch(
        updateModel({
          id: model.id,
          monitoring: {
            ...(model.monitoring || {}),
            latest_metrics: metrics,
            metrics_history: [...(model.monitoring?.metrics_history || []).slice(-59), metrics],
          },
        })
      );
    };

    socket.onerror = error => {
      console.error('Monitoring WebSocket error:', error);
      stopMonitoring();
    };

    monitoringRef.current.socket = socket;

    // Set up polling fallback
    monitoringRef.current.interval = setInterval(async () => {
      if (modelData?.monitoring?.latest_metrics) {
        dispatch(
          updateModel({
            id: model.id,
            monitoring: {
              ...(model.monitoring || {}),
              latest_metrics: modelData.monitoring.latest_metrics,
              metrics_history: [
                ...(model.monitoring?.metrics_history || []).slice(-59),
                modelData.monitoring.latest_metrics,
              ],
            },
          })
        );
      }
    }, 1000);
  }, [model, dispatch, modelData]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    if (monitoringRef.current.socket) {
      monitoringRef.current.socket.close();
      monitoringRef.current.socket = null;
    }

    if (monitoringRef.current.interval) {
      clearInterval(monitoringRef.current.interval);
      monitoringRef.current.interval = null;
    }
  }, []);

  // Cleanup on unmount or model change
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [model, stopMonitoring]);

  const addMetrics = useCallback((newMetrics: ModelMetrics) => {
    setMetrics(prev => [...prev, newMetrics]);
  }, []);

  const clearMetrics = useCallback(() => {
    setMetrics([]);
  }, []);

  return {
    metrics,
    addMetrics,
    clearMetrics,
    loading,
    error,
  };
};
