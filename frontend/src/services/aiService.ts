import { AIModel } from '@/types';
import axiosInstance from './api';

export const aiService = {
  // Model Management
  getModels: async (): Promise<AIModel[]> => {
    const response = await axiosInstance.get('/ai/models');
    return response.data;
  },

  getModel: async (id: number): Promise<AIModel> => {
    const response = await axiosInstance.get(`/ai/models/${id}`);
    return response.data;
  },

  createModel: async (model: Omit<AIModel, 'id'>): Promise<AIModel> => {
    const response = await axiosInstance.post('/ai/models', model);
    return response.data;
  },

  updateModel: async (id: number, updates: Partial<AIModel>): Promise<AIModel> => {
    const response = await axiosInstance.patch(`/ai/models/${id}`, updates);
    return response.data;
  },

  deleteModel: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/ai/models/${id}`);
  },

  // Training
  startTraining: async (modelId: number): Promise<void> => {
    await axiosInstance.post(`/ai/models/${modelId}/train`);
  },

  stopTraining: async (modelId: number): Promise<void> => {
    await axiosInstance.post(`/ai/models/${modelId}/stop`);
  },

  // Deployment
  deployModel: async (id: number, config: any): Promise<void> => {
    await axiosInstance.post(`/ai/models/${id}/deploy`, config);
  },

  stopDeployment: async (modelId: number): Promise<void> => {
    await axiosInstance.post(`/ai/models/${modelId}/deployment/stop`);
  },

  // Inference
  runInference: async (modelId: number, input: any): Promise<any> => {
    const response = await axiosInstance.post(`/ai/models/${modelId}/predict`, { input });
    return response.data;
  },

  // Monitoring
  getMetrics: async (modelId: number): Promise<any> => {
    const response = await axiosInstance.get(`/ai/models/${modelId}/metrics`);
    return response.data;
  },

  // Experiments
  getExperiments: async (modelId: number): Promise<any[]> => {
    const response = await axiosInstance.get(`/ai/models/${modelId}/experiments`);
    return response.data;
  },

  createExperiment: async (modelId: number, experiment: any): Promise<any> => {
    const response = await axiosInstance.post(`/ai/models/${modelId}/experiments`, experiment);
    return response.data;
  },

  // Versions
  getVersions: async (modelId: number): Promise<any[]> => {
    const response = await axiosInstance.get(`/ai/models/${modelId}/versions`);
    return response.data;
  },

  createVersion: async (modelId: number, version: any): Promise<any> => {
    const response = await axiosInstance.post(`/ai/models/${modelId}/versions`, version);
    return response.data;
  },
};
