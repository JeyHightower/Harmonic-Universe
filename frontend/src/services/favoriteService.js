import api from './api';

export const favoriteService = {
  async getFavorites() {
    const response = await api.get('/favorites');
    return response.data;
  },

  async addFavorite(universeId) {
    const response = await api.post(`/universes/${universeId}/favorite`);
    return response.data;
  },

  async removeFavorite(universeId) {
    const response = await api.delete(`/universes/${universeId}/favorite`);
    return response.data;
  },
};
