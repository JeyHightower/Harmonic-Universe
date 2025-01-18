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
    // Add CORS headers
    const currentPort = window.location.port;
    config.headers[
      'Access-Control-Allow-Origin'
    ] = `http://localhost:${currentPort}`;
    config.headers['Access-Control-Allow-Credentials'] = true;
    return config;
  },
  error => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      // Server responded with error
      console.error('Response error:', error.response.data);
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      return Promise.reject(error.response.data);
    } else if (error.request) {
      // Request made but no response
      console.error('Network error:', error.request);
      return Promise.reject({
        message:
          'Network error. Please check if the backend server is running.',
      });
    } else {
      // Request setup error
      console.error('Request setup error:', error.message);
      return Promise.reject({ message: 'Failed to make request.' });
    }
  }
);

export default api;
