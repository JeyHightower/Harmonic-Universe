import axiosInstance from './api';

export const aiService = {
  // Model Management
  getModels: async () => {
    const response = await axiosInstance.get('/ai/models');
    return response.data;
  },

  getModel: async (id) => {
    const response = await axiosInstance.get(`/ai/models/${id}`);
    return response.data;
  },

  createModel: async (model) => {
    const response = await axiosInstance.post('/ai/models', model);
    return response.data;
  },

  updateModel: async (id, updates) => {
    const response = await axiosInstance.patch(`/ai/models/${id}`, updates);
    return response.data;
  },

  deleteModel: async (id) => {
    await axiosInstance.delete(`/ai/models/${id}`);
  },

  // Training
  startTraining: async (modelId) => {
    await axiosInstance.post(`/ai/models/${modelId}/train`);
  },

  stopTraining: async (modelId) => {
    await axiosInstance.post(`/ai/models/${modelId}/stop`);
  },

  // Deployment
  deployModel: async (id, config) => {
    await axiosInstance.post(`/ai/models/${id}/deploy`, config);
  },

  stopDeployment: async (modelId) => {
    await axiosInstance.post(`/ai/models/${modelId}/deployment/stop`);
  },

  // Inference
  runInference: async (modelId, input) => {
    const response = await axiosInstance.post(`/ai/models/${modelId}/predict`, { input });
    return response.data;
  },

  // Monitoring
  getMetrics: async (modelId) => {
    const response = await axiosInstance.get(`/ai/models/${modelId}/metrics`);
    return response.data;
  },

  // Experiments
  getExperiments: async (modelId) => {
    const response = await axiosInstance.get(`/ai/models/${modelId}/experiments`);
    return response.data;
  },

  createExperiment: async (modelId, experiment) => {
    const response = await axiosInstance.post(`/ai/models/${modelId}/experiments`, experiment);
    return response.data;
  },

  // Versions
  getVersions: async (modelId) => {
    const response = await axiosInstance.get(`/ai/models/${modelId}/versions`);
    return response.data;
  },

  createVersion: async (modelId, version) => {
    const response = await axiosInstance.post(`/ai/models/${modelId}/versions`, version);
    return response.data;
  },
};
