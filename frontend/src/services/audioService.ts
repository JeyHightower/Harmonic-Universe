import { AudioTrack } from '@/types';
import axiosInstance from './api';

export const audioService = {
  getTracks: async (): Promise<AudioTrack[]> => {
    const response = await axiosInstance.get('/audio/tracks');
    return response.data;
  },

  getTrack: async (id: number): Promise<AudioTrack> => {
    const response = await axiosInstance.get(`/audio/tracks/${id}`);
    return response.data;
  },

  createTrack: async (track: Omit<AudioTrack, 'id'>): Promise<AudioTrack> => {
    const response = await axiosInstance.post('/audio/tracks', track);
    return response.data;
  },

  updateTrack: async (id: number, updates: Partial<AudioTrack>): Promise<AudioTrack> => {
    const response = await axiosInstance.patch(`/audio/tracks/${id}`, updates);
    return response.data;
  },

  deleteTrack: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/audio/tracks/${id}`);
  },

  applyEffect: async (trackId: number, effect: any): Promise<void> => {
    await axiosInstance.post(`/audio/tracks/${trackId}/effects`, effect);
  },

  removeEffect: async (trackId: number, effectId: number): Promise<void> => {
    await axiosInstance.delete(`/audio/tracks/${trackId}/effects/${effectId}`);
  },

  recordMIDI: async (trackId: number, events: any[]): Promise<void> => {
    await axiosInstance.post(`/audio/tracks/${trackId}/midi`, { events });
  },

  getMIDIEvents: async (trackId: number): Promise<any[]> => {
    const response = await axiosInstance.get(`/audio/tracks/${trackId}/midi`);
    return response.data;
  },

  startPlayback: async (trackId: number): Promise<void> => {
    await axiosInstance.post(`/audio/tracks/${trackId}/play`);
  },

  stopPlayback: async (trackId: number): Promise<void> => {
    await axiosInstance.post(`/audio/tracks/${trackId}/stop`);
  },

  exportTrack: async (trackId: number, format: string): Promise<string> => {
    const response = await axiosInstance.post(`/audio/tracks/${trackId}/export`, { format });
    return response.data;
  },
};
