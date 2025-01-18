import api from './api';

export const favoriteService = {
  async getFavorites() {
    const response = await api.get('/api/favorites');
    return response.data;
  },

  async addFavorite(universeId) {
    const response = await api.post(`/api/universes/${universeId}/favorite`);
    return response.data;
  },

  async removeFavorite(universeId) {
    const response = await api.delete(`/api/universes/${universeId}/favorite`);
    return response.data;
  },
};
