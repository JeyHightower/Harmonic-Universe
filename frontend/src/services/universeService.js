import api from '../../services/api';

export const universeService = {
  async getUniverses({ filter = 'all', sortBy = 'newest' } = {}) {
    const params = new URLSearchParams();
    params.append('filter', filter);
    params.append('sort', sortBy);

    const response = await api.get(`/api/universes?${params.toString()}`);
    return response.data;
  },

  async getUniverse(id) {
    const response = await api.get(`/api/universes/${id}`);
    return response.data;
  },

  async createUniverse(data) {
    const response = await api.post('/api/universes', data);
    return response.data;
  },

  async updateUniverse(id, data) {
    const response = await api.put(`/api/universes/${id}`, data);
    return response.data;
  },

  async deleteUniverse(id) {
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

  updateParameters: async (universeId, type, parameters) => {
    const response = await api.put(
      `/universes/${universeId}/parameters/${type}`,
      {
        parameters,
      }
    );
    return response.data;
  },

  toggleFavorite: async universeId => {
    const response = await api.post(`/api/universes/${universeId}/favorite`);
    return response.data;
  },
};
