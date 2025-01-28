/* global window */

import axios from 'axios';

// Environment configuration with fallbacks
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const API_TIMEOUT = parseInt(process.env.REACT_APP_API_TIMEOUT || '30000', 10);
const MAX_RETRIES = parseInt(process.env.REACT_APP_MAX_RETRIES || '3', 10);

// Custom error class for API errors
class APIError extends Error {
  constructor(message, code, details = null) {
    super(message);
    this.name = 'APIError';
    this.code = code;
    this.details = details;
  }
}

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Retry failed requests
api.interceptors.response.use(null, async error => {
  const config = error.config;
  config.retryCount = config.retryCount || 0;

  const shouldRetry =
    config.retryCount < MAX_RETRIES &&
    error.response?.status >= 500 &&
    ['get', 'head', 'options'].includes(config.method.toLowerCase());

  if (shouldRetry) {
    config.retryCount += 1;
    const delay = Math.min(1000 * 2 ** config.retryCount, 10000);
    await new Promise(resolve => setTimeout(resolve, delay));
    return api(config);
  }

  return Promise.reject(error);
});

// Add auth token to requests
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(
      new APIError('Request setup failed', 'REQUEST_SETUP_ERROR', error)
    );
  }
);

// Error handling interceptor
api.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response) {
      // Server responded with error
      const { status, data } = error.response;
      let message = data.message || 'An error occurred';
      let code = data.code || 'SERVER_ERROR';
      let details = data.details || null;

      // Handle specific status codes
      switch (status) {
        case 401:
          code = 'UNAUTHORIZED';
          // Clear token if unauthorized
          localStorage.removeItem('token');
          // You might want to redirect to login or trigger a refresh
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
          break;
        case 403:
          code = 'FORBIDDEN';
          break;
        case 404:
          code = 'NOT_FOUND';
          break;
        case 422:
          code = 'VALIDATION_ERROR';
          break;
        default:
          if (status >= 500) {
            code = 'SERVER_ERROR';
          }
      }

      throw new APIError(message, code, details);
    } else if (error.request) {
      // No response received
      throw new APIError('No response from server', 'NETWORK_ERROR', {
        request: error.request,
      });
    } else {
      // Request setup error
      throw new APIError(
        'Error setting up request',
        'REQUEST_SETUP_ERROR',
        error
      );
    }
  }
);

// Auth API
export const auth = {
  register: userData => api.post('/auth/register', userData),
  login: credentials => api.post('/auth/login', credentials),
  logout: () => {
    localStorage.removeItem('token');
    return api.post('/auth/logout');
  },
  getCurrentUser: () => api.get('/auth/me'),
  updateProfile: profileData => api.put('/auth/me', profileData),
  deleteAccount: () => api.delete('/auth/me'),
  deactivateAccount: () => api.post('/auth/me/deactivate'),
  activateAccount: () => api.post('/auth/me/activate'),
  updatePassword: passwordData =>
    api.put('/auth/me', {
      password: passwordData.newPassword,
      old_password: passwordData.oldPassword,
    }),
};

// Universe API
export const universe = {
  create: universeData => api.post('/universes', universeData),
  get: id => api.get(`/universes/${id}`),
  update: (id, universeData) => api.put(`/universes/${id}`, universeData),
  delete: id => api.delete(`/universes/${id}`),
  list: () => api.get('/universes'),
  getMyUniverses: () => api.get('/universes/my'),
  search: query => api.get(`/universes/search?q=${query}`),
  updateParameters: (id, parameters) =>
    api.put(`/universes/${id}/parameters`, { parameters }),
};

// Collaboration API
export const collaboration = {
  invite: (universeId, userData) =>
    api.post(`/universes/${universeId}/collaborators`, userData),
  removeCollaborator: (universeId, userId) =>
    api.delete(`/universes/${universeId}/collaborators/${userId}`),
  updatePermissions: (universeId, userId, permissions) =>
    api.put(`/universes/${universeId}/collaborators/${userId}`, {
      permissions,
    }),
  getCollaborators: universeId =>
    api.get(`/universes/${universeId}/collaborators`),
  updatePresence: (universeId, presenceData) =>
    api.post(`/collaboration/presence/${universeId}`, presenceData),
  getActivities: universeId => api.get(`/collaboration/activity/${universeId}`),
  createActivity: (universeId, activityData) =>
    api.post(`/collaboration/activity/${universeId}`, activityData),
};

// Physics API
export const physics = {
  updateParameters: (universeId, parameters) =>
    api.put(`/universes/${universeId}/physics`, parameters),
  getParameters: universeId => api.get(`/universes/${universeId}/physics`),
  simulatePhysics: (universeId, simulationData) =>
    api.post(`/universes/${universeId}/physics/simulate`, simulationData),
};

export default api;
