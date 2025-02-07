import { useGetModelQuery } from '@services/aiService';
import { RootState } from '@store/index';
import { updateModel } from '@store/slices/aiSlice';
import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

export interface ModelMetrics {
  timestamp: number;
  metrics: {
    [key: string]: number;
  };
  predictions: {
    total: number;
    correct: number;
    incorrect: number;
    accuracy: number;
  };
  performance: {
    latency_ms: number;
    throughput: number;
    memory_usage: number;
    cpu_usage: number;
    gpu_usage?: number;
  };
  drift: {
    feature_drift: {
      [key: string]: number;
    };
    prediction_drift: number;
    data_quality_score: number;
  };
}

export const useModelMonitoring = (modelId: number | null) => {
  const dispatch = useDispatch();
  const model = useSelector((state: RootState) => state.ai.models.find(m => m.id === modelId));
  const { data: modelData } = useGetModelQuery(modelId || 0, { skip: !modelId });
  const monitoringRef = useRef<{
    socket: WebSocket | null;
    interval: NodeJS.Timeout | null;
  }>({ socket: null, interval: null });

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

  return {
    initMonitoring,
    stopMonitoring,
    isMonitoring: !!monitoringRef.current.socket,
  };
};
