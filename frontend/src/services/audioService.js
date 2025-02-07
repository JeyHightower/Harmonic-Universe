import axiosInstance from './api';

export const audioService = {
  getTracks: async () => {
    const response = await axiosInstance.get('/audio/tracks');
    return response.data;
  },

  getTrack: async (id) => {
    const response = await axiosInstance.get(`/audio/tracks/${id}`);
    return response.data;
  },

  createTrack: async (track) => {
    const response = await axiosInstance.post('/audio/tracks', track);
    return response.data;
  },

  updateTrack: async (id, updates) => {
    const response = await axiosInstance.patch(`/audio/tracks/${id}`, updates);
    return response.data;
  },

  deleteTrack: async (id) => {
    await axiosInstance.delete(`/audio/tracks/${id}`);
  },

  applyEffect: async (trackId, effect) => {
    await axiosInstance.post(`/audio/tracks/${trackId}/effects`, effect);
  },

  removeEffect: async (trackId, effectId) => {
    await axiosInstance.delete(`/audio/tracks/${trackId}/effects/${effectId}`);
  },

  recordMIDI: async (trackId, events) => {
    await axiosInstance.post(`/audio/tracks/${trackId}/midi`, { events });
  },

  getMIDIEvents: async (trackId) => {
    const response = await axiosInstance.get(`/audio/tracks/${trackId}/midi`);
    return response.data;
  },

  startPlayback: async (trackId) => {
    await axiosInstance.post(`/audio/tracks/${trackId}/play`);
  },

  stopPlayback: async (trackId) => {
    await axiosInstance.post(`/audio/tracks/${trackId}/stop`);
  },

  exportTrack: async (trackId, format) => {
    const response = await axiosInstance.post(`/audio/tracks/${trackId}/export`, { format });
    return response.data;
  },
};
