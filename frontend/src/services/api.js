/* global window */
import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  config => {
    const token = window.localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      // Handle specific error cases
      switch (error.response.status) {
        case 401:
          // Handle unauthorized
          window.localStorage.removeItem('token');
          window.location.href = '/login';
          break;
        case 403:
          // Handle forbidden
          break;
        case 404:
          // Handle not found
          break;
        default:
          // Handle other errors
          break;
      }
    }
    return Promise.reject(error);
  }
);

export const get = async (url, config = {}) => {
  const response = await api.get(url, config);
  return response.data;
};

export const post = async (url, data = {}, config = {}) => {
  const response = await api.post(url, data, config);
  return response.data;
};

export const put = async (url, data = {}, config = {}) => {
  const response = await api.put(url, data, config);
  return response.data;
};

export const del = async (url, config = {}) => {
  const response = await api.delete(url, config);
  return response.data;
};

export default api;
