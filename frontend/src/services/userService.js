import axios from 'axios';
import api from './api';

const API_URL = '/api/users';

const userService = {
  getProfile: async userId => {
    return axios.get(`${API_URL}/profile/${userId}`);
  },

  updateProfile: async profile => {
    return axios.post(`${API_URL}/profile`, profile);
  },

  deleteProfile: async userId => {
    return axios.delete(`${API_URL}/profile/${userId}`);
  },

  uploadAvatar: async (userId, file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return axios.post(`${API_URL}/profile/${userId}/avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  searchUsers: async query => {
    const response = await api.get(
      `/api/users/search?q=${encodeURIComponent(query)}`
    );
    return response.data;
  },

  getUsersBatch: async userIds => {
    try {
      const response = await axios.post('/api/users/batch', { userIds });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch users');
    }
  },

  getCurrentUser: async () => {
    const response = await api.get('/api/users/me');
    return response.data;
  },

  updateProfile: async data => {
    const response = await api.put('/api/users/profile', data);
    return response.data;
  },
};

export { userService };
