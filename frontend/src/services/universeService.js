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
  }
};
