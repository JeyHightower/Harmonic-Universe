import { useRunInferenceMutation } from '@services/aiService';
import { RootState } from '@store/index';
import { addInferenceResult } from '@store/slices/aiSlice';
import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

export const useAIInference = (modelId: number | null) => {
  const dispatch = useDispatch();
  const model = useSelector((state: RootState) => state.ai.models.find(m => m.id === modelId));
  const [runInference] = useRunInferenceMutation();
  const streamRef = useRef<{
    socket: WebSocket | null;
    buffer: any[];
  }>({ socket: null, buffer: [] });

  // Initialize real-time inference stream
  const initStream = useCallback(() => {
    if (!model) return;

    // Connect to WebSocket for real-time inference
    const socket = new WebSocket(`${process.env.VITE_WS_URL}/ai/inference/${model.id}`);

    socket.onmessage = event => {
      const result = JSON.parse(event.data);
      streamRef.current.buffer.push(result);

      // Process buffer when it reaches a certain size
      if (streamRef.current.buffer.length >= 10) {
        processBuffer();
      }
    };

    socket.onerror = error => {
      console.error('Inference WebSocket error:', error);
      stopStream();
    };

    streamRef.current.socket = socket;
  }, [model]);

  // Stop inference stream
  const stopStream = useCallback(() => {
    if (streamRef.current.socket) {
      streamRef.current.socket.close();
      streamRef.current.socket = null;
    }
    streamRef.current.buffer = [];
  }, []);

  // Process buffered results
  const processBuffer = useCallback(() => {
    const results = streamRef.current.buffer;
    streamRef.current.buffer = [];

    results.forEach(result => {
      dispatch(addInferenceResult({ modelId: model?.id || 0, result }));
    });
  }, [dispatch, model]);

  // Run inference on single input
  const predict = useCallback(
    async (input: any) => {
      if (!model) return null;
      try {
        const response = await runInference({ id: model.id, input });
        return response;
      } catch (error) {
        console.error('Inference error:', error);
        return null;
      }
    },
    [model, runInference]
  );

  // Run inference on batch of inputs
  const predictBatch = useCallback(
    async (inputs: any[]) => {
      if (!model) return [];
      try {
        const results = await Promise.all(
          inputs.map(input => runInference({ id: model.id, input }))
        );
        return results;
      } catch (error) {
        console.error('Batch inference error:', error);
        return [];
      }
    },
    [model, runInference]
  );

  // Get inference history
  const getHistory = useCallback(async () => {
    if (!model) return [];
    try {
      // This would need a new endpoint in the aiService
      return [];
    } catch (error) {
      console.error('Failed to get inference history:', error);
      return [];
    }
  }, [model]);

  // Cleanup on unmount or model change
  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [model, stopStream]);

  return {
    predict,
    predictBatch,
    initStream,
    stopStream,
    getHistory,
  };
};
