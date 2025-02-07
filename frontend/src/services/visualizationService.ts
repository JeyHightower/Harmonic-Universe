import { Visualization } from '@/types';
import axiosInstance from './api';

export const visualizationService = {
  // Visualization Management
  getVisualizations: async (): Promise<Visualization[]> => {
    const response = await axiosInstance.get('/visualization');
    return response.data;
  },

  getVisualization: async (id: number): Promise<Visualization> => {
    const response = await axiosInstance.get(`/visualization/${id}`);
    return response.data;
  },

  createVisualization: async (visualization: Omit<Visualization, 'id'>): Promise<Visualization> => {
    const response = await axiosInstance.post('/visualization', visualization);
    return response.data;
  },

  updateVisualization: async (
    id: number,
    updates: Partial<Visualization>
  ): Promise<Visualization> => {
    const response = await axiosInstance.patch(`/visualization/${id}`, updates);
    return response.data;
  },

  deleteVisualization: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/visualization/${id}`);
  },

  // Data Mappings
  updateDataMappings: async (id: number, mappings: any[]): Promise<void> => {
    await axiosInstance.patch(`/visualization/${id}/mappings`, { mappings });
  },

  // Stream Configuration
  updateStreamConfig: async (id: number, config: any): Promise<void> => {
    await axiosInstance.patch(`/visualization/${id}/stream`, config);
  },

  // Real-time Data
  startStream: async (id: number): Promise<void> => {
    await axiosInstance.post(`/visualization/${id}/stream/start`);
  },

  stopStream: async (id: number): Promise<void> => {
    await axiosInstance.post(`/visualization/${id}/stream/stop`);
  },
};
