import api from './api';

export const musicService = {
  getMusicParameters: async universeId => {
    try {
      const response = await api.get(`/api/universes/${universeId}/music`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch music parameters'
      );
    }
  },

  updateMusicParameters: async (universeId, parameters) => {
    try {
      const response = await api.put(
        `/api/universes/${universeId}/music`,
        parameters
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to update music parameters'
      );
    }
  },

  // Additional music-related API calls can be added here
  generateHarmony: async (universeId, parameters) => {
    try {
      const response = await api.post(
        `/api/universes/${universeId}/music/generate`,
        parameters
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to generate harmony'
      );
    }
  },

  exportAudio: async (universeId, format = 'wav') => {
    try {
      const response = await api.get(
        `/api/universes/${universeId}/music/export?format=${format}`,
        {
          responseType: 'blob',
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to export audio'
      );
    }
  },
};
