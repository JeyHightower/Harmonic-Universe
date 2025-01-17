import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const musicService = {
  async getMusicParameters(universeId) {
    try {
      const response = await axios.get(
        `${API_URL}/universes/${universeId}/parameters`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching music parameters:', error);
      throw error;
    }
  },

  async updateMusicParameters(universeId, parameters) {
    try {
      const response = await axios.put(
        `${API_URL}/universes/${universeId}/parameters`,
        parameters
      );
      return response.data;
    } catch (error) {
      console.error('Error updating music parameters:', error);
      throw error;
    }
  },

  async exportAudio(universeId, format = 'wav') {
    try {
      const response = await axios.get(
        `${API_URL}/universes/${universeId}/export?format=${format}`,
        { responseType: 'blob' }
      );
      return response.data;
    } catch (error) {
      console.error('Error exporting audio:', error);
      throw error;
    }
  },

  async getPresets(universeId) {
    try {
      const response = await axios.get(
        `${API_URL}/universes/${universeId}/presets`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching presets:', error);
      throw error;
    }
  },

  async savePreset(universeId, presetData) {
    try {
      const response = await axios.post(
        `${API_URL}/universes/${universeId}/presets`,
        presetData
      );
      return response.data;
    } catch (error) {
      console.error('Error saving preset:', error);
      throw error;
    }
  },
};
