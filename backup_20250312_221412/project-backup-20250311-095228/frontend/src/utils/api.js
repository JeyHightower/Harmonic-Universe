import axios from 'axios';
import { API_CONFIG } from './config';
import { shouldUseFallback } from './authFallback';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: '/api',  // Use relative URL for proxy
  timeout: API_CONFIG.TIMEOUT || 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true
});

// Add request interceptor
api.interceptors.request.use(
  (config) => {
    // Log outgoing requests in development
    if (process.env.NODE_ENV === 'development') {
      console.debug('API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        data: config.data,
        headers: config.headers
      });
    }
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor
api.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (process.env.NODE_ENV === 'development') {
      console.debug('API Response:', {
        status: response.status,
        data: response.data,
        headers: response.headers
      });
    }
    return response;
  },
  async (error) => {
    // Log error details in development
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: error.config
      });
    }

    // Check if we should use fallback
    if (await shouldUseFallback(error)) {
      console.warn('Using fallback mode due to API error');
      // You can implement fallback logic here
    }

    return Promise.reject(error);
  }
);

// Test the API connection
api.get('/health')
  .then(response => {
    console.log('API Health Check:', response.data);
  })
  .catch(error => {
    console.error('API Health Check Failed:', error);
  });

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
