import {
  useDeployModelMutation,
  useGetModelQuery,
  useStopDeploymentMutation,
} from '@services/aiService';
import { RootState } from '@store/index';
import { updateModel } from '@store/slices/aiSlice';
import { useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

export interface DeploymentConfig {
  environment: string;
  resources: {
    cpu: number;
    memory: number;
    gpu?: number;
  };
  scaling: {
    minReplicas: number;
    maxReplicas: number;
    targetCPUUtilization: number;
  };
  version?: string;
}

export interface DeploymentStatus {
  status: string;
  endpoint: string | null;
  logs: string[];
  metrics?: {
    requests_per_second: number;
    latency_ms: {
      p50: number;
      p95: number;
      p99: number;
    };
    error_rate: number;
    memory_usage: number;
    cpu_usage: number;
    gpu_usage?: number;
    active_instances: number;
  };
}

export const useModelDeployment = (modelId: number | null) => {
  const dispatch = useDispatch();
  const model = useSelector((state: RootState) => state.ai.models.find(m => m.id === modelId));
  const { data: modelData } = useGetModelQuery(modelId || 0, { skip: !modelId });
  const [deployModel] = useDeployModelMutation();
  const [stopDeployment] = useStopDeploymentMutation();
  const deploymentRef = useRef<DeploymentStatus>({
    status: 'inactive',
    endpoint: null,
    logs: [],
  });

  // Deploy model
  const deploy = useCallback(
    async (config: DeploymentConfig) => {
      if (!model) return false;

      try {
        await deployModel({ id: model.id, config });
        deploymentRef.current = {
          status: 'deploying',
          endpoint: null,
          logs: [],
        };
        return true;
      } catch (error) {
        console.error('Failed to deploy model:', error);
        deploymentRef.current.status = 'failed';
        return false;
      }
    },
    [model, deployModel]
  );

  // Stop deployment
  const stop = useCallback(async () => {
    if (!model) return false;

    try {
      await stopDeployment(model.id);
      deploymentRef.current = {
        status: 'inactive',
        endpoint: null,
        logs: [],
      };
      dispatch(
        updateModel({
          id: model.id,
          deployment: {
            status: 'inactive',
            endpoint: null,
          },
        })
      );
      return true;
    } catch (error) {
      console.error('Failed to stop deployment:', error);
      return false;
    }
  }, [model, dispatch, stopDeployment]);

  return {
    deploy,
    stop,
    status: deploymentRef.current.status,
    endpoint: deploymentRef.current.endpoint,
    logs: deploymentRef.current.logs,
    metrics: modelData?.deployment?.metrics,
  };
};
