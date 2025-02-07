import {
  DataMapping,
  StreamConfig,
  Visualization,
  VisualizationFormData,
  VisualizationUpdateData,
} from '@/types/visualization';
import api from './api';

export const visualizationApi = {
  fetchAll: async (projectId: number): Promise<Visualization[]> => {
    const response = await api.get<Visualization[]>(`/api/project/${projectId}/visualizations`);
    return response.data;
  },

  fetchByAudio: async (audioId: number): Promise<Visualization[]> => {
    const response = await api.get<Visualization[]>(`/api/audio/${audioId}/visualizations`);
    return response.data;
  },

  fetchOne: async (id: number): Promise<Visualization> => {
    const response = await api.get<Visualization>(`/api/visualizations/${id}`);
    return response.data;
  },

  create: async (
    projectId: number,
    audioId: number,
    data: VisualizationFormData
  ): Promise<Visualization> => {
    const response = await api.post<Visualization>(
      `/api/project/${projectId}/audio/${audioId}/visualizations`,
      data
    );
    return response.data;
  },

  update: async (id: number, data: VisualizationUpdateData): Promise<Visualization> => {
    const response = await api.put<Visualization>(`/api/visualizations/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/visualizations/${id}`);
  },

  updateDataMappings: async (id: number, dataMappings: DataMapping[]): Promise<Visualization> => {
    const response = await api.patch<Visualization>(`/api/visualizations/${id}/mappings`, {
      dataMappings,
    });
    return response.data;
  },

  updateStreamConfig: async (id: number, streamConfig: StreamConfig): Promise<Visualization> => {
    const response = await api.patch<Visualization>(`/api/visualizations/${id}/stream-config`, {
      streamConfig,
    });
    return response.data;
  },
};

export default visualizationApi;
