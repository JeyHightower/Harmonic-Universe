import axios from 'axios';

const API_URL = '/api/audio';

export const audioService = {
  getAudioSettings: async universeId => {
    return axios.get(`${API_URL}/settings/${universeId}`);
  },

  updateAudioSettings: async settings => {
    return axios.post(`${API_URL}/settings`, settings);
  },

  deleteSettings: async universeId => {
    return axios.delete(`${API_URL}/settings/${universeId}`);
  },

  previewAudio: async universeId => {
    return axios.get(`${API_URL}/preview/${universeId}`);
  },
};
