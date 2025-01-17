import axios from 'axios';
import { logError, handleApiError } from './errorLogging';

const api = axios.create({
  baseURL: 'http://127.0.0.1:5001',
  timeout: 10000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    logError(error, 'API Request Interceptor');
    return Promise.reject(handleApiError(error));
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    logError(error, 'API Response Interceptor');
    const handledError = handleApiError(error);

    // Handle token expiration
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    return Promise.reject(handledError);
  }
);

export default api;
