import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5001',
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      // Server responded with error
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      return Promise.reject(error.response.data);
    }

    if (error.request) {
      // Request made but no response
      return Promise.reject({
        message: 'Network error. Please check your connection and try again.',
      });
    }

    // Request setup error
    return Promise.reject({
      message: 'An unexpected error occurred. Please try again.',
    });
  }
);

export default api;
