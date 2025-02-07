import { useStartTrainingMutation, useStopTrainingMutation } from '@services/aiService';
import { RootState } from '@store/index';
import { startTraining, stopTraining, updateTrainingMetrics } from '@store/slices/aiSlice';
import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

export interface AITraining {
  start: () => Promise;
  stop: () => Promise;
}

export const useAITraining = (modelId: number | null): AITraining => {
  const dispatch = useDispatch();
  const model = useSelector((state: RootState) => state.ai.models.find(m => m.id === modelId));
  const [startTrainingMutation] = useStartTrainingMutation();
  const [stopTrainingMutation] = useStopTrainingMutation();
  const trainingRef = useRef<{
    socket: WebSocket | null;
    interval: NodeJS.Timeout | null;
  }>({ socket: null, interval: null });

  // Initialize WebSocket connection for training updates
  const initTrainingSocket = useCallback(() => {
    if (!model) return;

    const socket = new WebSocket(`${process.env.VITE_WS_URL}/ai/training/${model.id}`);

    socket.onmessage = event => {
      const metrics = JSON.parse(event.data);
      dispatch(updateTrainingMetrics({ modelId: model.id, metrics }));
    };

    socket.onerror = error => {
      console.error('Training WebSocket error:', error);
      stopTraining();
    };

    trainingRef.current.socket = socket;
  }, [model, dispatch]);

  // Start model training
  const startTrainingProcess = useCallback(
    async (hyperparameters: { [key: string]: any }) => {
      if (!model) return false;

      try {
        await startTrainingMutation({ id: model.id, hyperparameters });
        dispatch(startTraining({ modelId: model.id }));
        initTrainingSocket();
        return true;
      } catch (error) {
        console.error('Failed to start training:', error);
        return false;
      }
    },
    [model, dispatch, startTrainingMutation, initTrainingSocket]
  );

  // Stop model training
  const stopTrainingProcess = useCallback(async () => {
    if (!model) return false;

    try {
      await stopTrainingMutation(model.id);

      if (trainingRef.current.socket) {
        trainingRef.current.socket.close();
        trainingRef.current.socket = null;
      }

      if (trainingRef.current.interval) {
        clearInterval(trainingRef.current.interval);
        trainingRef.current.interval = null;
      }

      return true;
    } catch (error) {
      console.error('Failed to stop training:', error);
      return false;
    }
  }, [model, stopTrainingMutation]);

  // Cleanup on unmount or model change
  useEffect(() => {
    return () => {
      if (trainingRef.current.socket) {
        trainingRef.current.socket.close();
        trainingRef.current.socket = null;
      }
      if (trainingRef.current.interval) {
        clearInterval(trainingRef.current.interval);
        trainingRef.current.interval = null;
      }
    };
  }, [model]);

  return {
    start: startTrainingProcess,
    stop: stopTrainingProcess,
  };
};
