import api from './api';

export const visualizationApi = {
  fetchAll: async (projectId) => {
    const response = await api.get(`/api/project/${projectId}/visualizations`);
    return response.data;
  },

  fetchByAudio: async (audioId) => {
    const response = await api.get(`/api/audio/${audioId}/visualizations`);
    return response.data;
  },

  fetchOne: async (id) => {
    const response = await api.get(`/api/visualizations/${id}`);
    return response.data;
  },

  create: async (projectId, audioId, data) => {
    const response = await api.post(
      `/api/project/${projectId}/audio/${audioId}/visualizations`,
      data
    );
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/api/visualizations/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    await api.delete(`/api/visualizations/${id}`);
  },

  updateDataMappings: async (id, dataMappings) => {
    const response = await api.patch(`/api/visualizations/${id}/mappings`, {
      dataMappings,
    });
    return response.data;
  },

  updateStreamConfig: async (id, streamConfig) => {
    const response = await api.patch(`/api/visualizations/${id}/stream-config`, {
      streamConfig,
    });
    return response.data;
  },
};

export default visualizationApi;
