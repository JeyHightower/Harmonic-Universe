import axios from 'axios';
import { AUTH_CONFIG } from './config';
import { shouldUseFallback } from './authFallback';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with base configuration
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // For development, log all outgoing requests
    if (process.env.NODE_ENV === 'development') {
      console.debug(`API Request: ${config.method.toUpperCase()} ${config.url}`, config);
    }

    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => {
    // For development, log all responses
    if (process.env.NODE_ENV === 'development') {
      console.debug(`API Response: ${response.status} ${response.config.url}`, response.data);
    }

    return response;
  },
  (error) => {
    // Check if we should use offline fallback
    if (shouldUseFallback(error)) {
      console.warn('Network error detected in API call - using fallback mode');
      // Return a resolved promise with fake "fallback mode" indicator
      // This will allow the authFallback system to take over
      return Promise.resolve({
        data: {
          fallbackMode: true,
          error: error.message || 'Network error'
        }
      });
    }

    console.error('API Response Error:', error);
    return Promise.reject(error);
  }
);

// API endpoints
export const endpoints = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout'
  },
  user: {
    profile: '/user/profile',
    settings: '/user/settings'
  },
  universes: {
    list: '/universes',
    create: '/universes',
    get: (id) => `/universes/${id}`,
    update: (id) => `/universes/${id}`,
    delete: (id) => `/universes/${id}`
  }
};

// API methods
export const apiClient = {
  // Auth methods
  login: (credentials) => api.post(endpoints.auth.login, credentials),
  register: (userData) => api.post(endpoints.auth.register, userData),
  logout: () => api.post(endpoints.auth.logout),

  // User methods
  getUserProfile: () => api.get(endpoints.user.profile),
  updateUserProfile: (data) => api.put(endpoints.user.profile, data),
  updateUserSettings: (settings) => api.put(endpoints.user.settings, settings),

  // Universe methods
  getUniverses: () => api.get(endpoints.universes.list),
  createUniverse: (data) => api.post(endpoints.universes.create, data),
  getUniverse: (id) => api.get(endpoints.universes.get(id)),
  updateUniverse: (id, data) => api.put(endpoints.universes.update(id), data),
  deleteUniverse: (id) => api.delete(endpoints.universes.delete(id))
};

export default apiClient;
