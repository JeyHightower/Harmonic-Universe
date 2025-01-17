import api from './api';

export const storyboardService = {
  async getStoryboards(universeId, queryParams = '') {
    const response = await api.get(
      `/universes/${universeId}/storyboard?${queryParams}`
    );
    return response.data;
  },

  async addStoryboard(universeId, storyboardData) {
    const response = await api.post(
      `/universes/${universeId}/storyboard`,
      storyboardData
    );
    return response.data;
  },

  async updateStoryboard(universeId, storyboardId, storyboardData) {
    const response = await api.put(
      `/universes/${universeId}/storyboard/${storyboardId}`,
      storyboardData
    );
    return response.data;
  },

  async deleteStoryboard(universeId, storyboardId) {
    await api.delete(`/universes/${universeId}/storyboard/${storyboardId}`);
  },
};
