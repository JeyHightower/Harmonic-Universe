import { DataMapping, StreamConfig, Visualization } from '@/types/visualization';
import api from './api';

export const visualizationService = {
  // Fetch visualizations for a project
  fetchVisualizations: async (projectId: number): Promise<Visualization[]> => {
    const response = await api.get(`/api/v1/project/${projectId}/visualizations`);
    return response.data;
  },

  // Fetch a single visualization
  fetchVisualization: async (vizId: number): Promise<Visualization> => {
    const response = await api.get(`/api/v1/visualizations/${vizId}`);
    return response.data;
  },

  // Create a new visualization
  createVisualization: async (
    projectId: number,
    audioId: number,
    data: Partial<Visualization>
  ): Promise<Visualization> => {
    const response = await api.post(
      `/api/v1/project/${projectId}/audio/${audioId}/visualizations`,
      data
    );
    return response.data;
  },

  // Update a visualization
  updateVisualization: async (
    vizId: number,
    data: Partial<Visualization>
  ): Promise<Visualization> => {
    const response = await api.put(`/api/v1/visualizations/${vizId}`, data);
    return response.data;
  },

  // Delete a visualization
  deleteVisualization: async (vizId: number): Promise<void> => {
    await api.delete(`/api/v1/visualizations/${vizId}`);
  },

  // Update data mappings
  updateDataMappings: async (vizId: number, mappings: DataMapping[]): Promise<Visualization> => {
    const response = await api.put(`/api/v1/visualizations/${vizId}/mappings`, { mappings });
    return response.data;
  },

  // Update stream configuration
  updateStreamConfig: async (vizId: number, config: StreamConfig): Promise<Visualization> => {
    const response = await api.put(`/api/v1/visualizations/${vizId}/stream-config`, config);
    return response.data;
  },

  // Start real-time visualization
  startVisualization: async (vizId: number): Promise<void> => {
    await api.post(`/api/v1/visualizations/${vizId}/start`);
  },

  // Stop real-time visualization
  stopVisualization: async (vizId: number): Promise<void> => {
    await api.post(`/api/v1/visualizations/${vizId}/stop`);
  },

  // Export visualization as image
  exportImage: async (vizId: number, format: string): Promise<Blob> => {
    const response = await api.get(`/api/v1/visualizations/${vizId}/export?format=${format}`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
