import axiosInstance from './api';

export const visualizationService = {
  // Visualization Management
  getVisualizations: async () => {
    const response = await axiosInstance.get('/visualization');
    return response.data;
  },

  getVisualization: async (id) => {
    const response = await axiosInstance.get(`/visualization/${id}`);
    return response.data;
  },

  createVisualization: async (visualization) => {
    const response = await axiosInstance.post('/visualization', visualization);
    return response.data;
  },

  updateVisualization: async (id, updates) => {
    const response = await axiosInstance.patch(`/visualization/${id}`, updates);
    return response.data;
  },

  deleteVisualization: async (id) => {
    await axiosInstance.delete(`/visualization/${id}`);
  },

  // Data Mappings
  updateDataMappings: async (id, mappings) => {
    await axiosInstance.patch(`/visualization/${id}/mappings`, { mappings });
  },

  // Stream Configuration
  updateStreamConfig: async (id, config) => {
    await axiosInstance.patch(`/visualization/${id}/stream`, config);
  },

  // Real-time Data
  startStream: async (id) => {
    await axiosInstance.post(`/visualization/${id}/stream/start`);
  },

  stopStream: async (id) => {
    await axiosInstance.post(`/visualization/${id}/stream/stop`);
  },
};
