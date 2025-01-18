import api from './api';

export const universeService = {
  getAllUniverses: async () => {
    const response = await api.get('/api/universes');
    return response.data;
  },

  getUniverseById: async id => {
    const response = await api.get(`/api/universes/${id}`);
    return response.data;
  },

  createUniverse: async universeData => {
    const response = await api.post('/api/universes', universeData);
    return response.data;
  },

  updateUniverse: async (id, universeData) => {
    const response = await api.put(`/api/universes/${id}`, universeData);
    return response.data;
  },

  deleteUniverse: async id => {
    await api.delete(`/api/universes/${id}`);
  },

  updatePrivacy: async (universeId, isPublic) => {
    const response = await api.patch(`/api/universes/${universeId}/privacy`, {
      is_public: isPublic,
    });
    return response.data;
  },

  shareUniverse: async (universeId, userId) => {
    const response = await api.post(`/api/universes/${universeId}/share`, {
      user_id: userId,
    });
    return response.data;
  },

  unshareUniverse: async (universeId, userId) => {
    const response = await api.delete(
      `/api/universes/${universeId}/share/${userId}`
    );
    return response.data;
  },
};
