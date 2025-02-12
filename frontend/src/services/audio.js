import api from './api';

export const audioService = {
  // Fetch audio tracks for a project
  fetchTracks: async (projectId) => {
    const response = await api.get(`/api/v1/project/${projectId}/audio`);
    return response.data;
  },

  // Upload a new audio track
  uploadTrack: async (projectId, file, config) => {
    const formData = new FormData();
    formData.append('file', file);
    if (config) {
      formData.append('config', JSON.stringify(config));
    }
    const response = await api.post(`/api/v1/project/${projectId}/audio`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete an audio track
  deleteTrack: async (trackId) => {
    await api.delete(`/api/v1/audio/${trackId}`);
  },

  // Update audio track processing configuration
  updateProcessing: async (trackId, config) => {
    const response = await api.put(`/api/v1/audio/${trackId}/processing`, config);
    return response.data;
  },

  // Get audio track waveform data
  getWaveform: async (trackId) => {
    const response = await api.get(`/api/v1/audio/${trackId}/waveform`);
    return response.data;
  },

  // Export processed audio track
  exportTrack: async (trackId, format) => {
    const response = await api.get(`/api/v1/audio/${trackId}/export?format=${format}`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
