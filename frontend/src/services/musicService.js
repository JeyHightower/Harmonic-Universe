import axios from 'axios';

const API_URL = '/api/music';

export const musicService = {
  getMusicParameters: async universeId => {
    return axios.get(`${API_URL}/parameters/${universeId}`);
  },

  updateMusicParameters: async parameters => {
    return axios.post(`${API_URL}/parameters`, parameters);
  },

  deleteSettings: async universeId => {
    return axios.delete(`${API_URL}/parameters/${universeId}`);
  },

  generateAIMusic: async (universeId, parameters) => {
    return axios.post(`${API_URL}/generate/${universeId}`, parameters);
  },

  // Additional music-related API calls can be added here
  generateHarmony: async (universeId, parameters) => {
    try {
      const response = await axios.post(
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
      const response = await axios.get(
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

  applyStyleTransfer: async (sourceId, targetId, aspects) => {
    try {
      const response = await axios.post('/api/audio/style-transfer', {
        source_id: sourceId,
        target_id: targetId,
        aspects,
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to apply style transfer'
      );
    }
  },
};
