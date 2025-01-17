import api from './api';

export const universeService = {
  async getAllUniverses() {
    const response = await api.get('/universes');
    return response.data;
  },

  async getUniverseById(id) {
    const response = await api.get(`/universes/${id}`);
    return response.data;
  },

  async createUniverse(universeData) {
    const response = await api.post('/universes', universeData);
    return response.data;
  },

  async updateUniverse(id, universeData) {
    const response = await api.put(`/universes/${id}`, universeData);
    return response.data;
  },

  async deleteUniverse(id) {
    await api.delete(`/universes/${id}`);
  },

  async shareUniverse(id, userId) {
    const response = await api.post(`/universes/${id}/share`, { userId });
    return response.data;
  },

  async unshareUniverse(id, userId) {
    const response = await api.delete(`/universes/${id}/share/${userId}`);
    return response.data;
  },

  async setPrivacy(id, isPublic) {
    const response = await api.put(`/universes/${id}/privacy`, { isPublic });
    return response.data;
  },

  async getSharedUniverses() {
    const response = await api.get('/universes/shared');
    return response.data;
  },

  async getPublicUniverses() {
    const response = await api.get('/universes/public');
    return response.data;
  },

  async updatePrivacy(universeId, isPublic) {
    const response = await api.patch(`/universes/${universeId}/privacy`, {
      is_public: isPublic,
    });
    return response.data;
  },
};
