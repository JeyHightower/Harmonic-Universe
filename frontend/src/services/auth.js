import axios from 'axios';

const API_URL = '/api/auth';

export const authService = {
  async login(credentials) {
    const response = await axios.post(`${API_URL}/login`, credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  async register(userData) {
    const response = await axios.post(`${API_URL}/register`, userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  async logout() {
    localStorage.removeItem('token');
  },

  async getCurrentUser() {
    const token = localStorage.getItem('token');
    if (!token) return null;

    const response = await axios.get(`${API_URL}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async updateProfile(userData) {
    const token = localStorage.getItem('token');
    const response = await axios.put(`${API_URL}/profile`, userData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async changePassword(passwords) {
    const token = localStorage.getItem('token');
    const response = await axios.put(`${API_URL}/change-password`, passwords, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async deleteAccount() {
    const token = localStorage.getItem('token');
    await axios.delete(`${API_URL}/account`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    localStorage.removeItem('token');
  },
};
