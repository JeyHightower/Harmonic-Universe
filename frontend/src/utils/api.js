import axios from 'axios';
import { shouldUseFallback } from './authFallback';
import { API_CONFIG } from './config';

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
    // Extract just the data from the response to avoid serialization issues
    response.data = response.data || {};
    return response.data;
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

    // Format the error for better handling
    const formattedError = {
      message: error.response?.data?.message || error.message || 'An unknown error occurred',
      status: error.response?.status,
      data: error.response?.data
    };

    return Promise.reject(formattedError);
  }
);

// Test the API connection - but only do it once at startup, not on every import
// REMOVING this immediate invocation as it causes issues with modal system
// api.get('/health')
//   .then(response => {
//     console.log('API Health Check:', response.data);
//   })
//   .catch(error => {
//     console.error('API Health Check Failed:', error);
//   });

// API endpoints
export const endpoints = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    demoLogin: '/auth/demo-login',
    me: '/auth/me'
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
    delete: (id) => `/universes/${id}`,
    scenes: (id) => `/universes/${id}/scenes`
  },
  scenes: {
    list: '/scenes',
    create: '/scenes',
    get: (id) => `/scenes/${id}`,
    update: (id) => `/scenes/${id}`,
    delete: (id) => `/scenes/${id}`,
    reorder: '/scenes/reorder'
  },
  physicsObjects: {
    list: '/physics-objects',
    create: '/physics-objects',
    get: (id) => `/physics-objects/${id}`,
    update: (id) => `/physics-objects/${id}`,
    delete: (id) => `/physics-objects/${id}`,
    forScene: (sceneId) => `/scenes/${sceneId}/physics-objects`
  }
};

// API methods
export const apiClient = {
  // Auth methods
  login: (credentials) => api.post(endpoints.auth.login, credentials),
  register: (userData) => api.post(endpoints.auth.register, userData),
  logout: () => api.post(endpoints.auth.logout),
  demoLogin: (options = {}) => api.post(endpoints.auth.demoLogin, {}, options),

  // User methods
  getUserProfile: () => api.get(endpoints.user.profile),
  updateUserProfile: (data) => api.put(endpoints.user.profile, data),
  updateUserSettings: (settings) => api.put(endpoints.user.settings, settings),

  // Universe methods
  getUniverses: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.includePublic) {
      queryParams.append('public', 'true');
    }
    return api.get(`${endpoints.universes.list}?${queryParams.toString()}`);
  },
  createUniverse: (data) => api.post(endpoints.universes.create, data),
  getUniverse: (id, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.includeScenes) {
      queryParams.append('include_scenes', 'true');
    }
    return api.get(`${endpoints.universes.get(id)}?${queryParams.toString()}`);
  },
  updateUniverse: (id, data) => api.put(endpoints.universes.update(id), data),
  deleteUniverse: (id) => api.delete(endpoints.universes.delete(id)),
  getUniverseScenes: (universeId) => api.get(endpoints.universes.scenes(universeId)),
  updateUniversePhysics: (universeId, physicsParams) => api.put(`/api/universes/${universeId}/physics`, {
    physics_params: physicsParams
  }),
  updateUniverseHarmony: (universeId, harmonyParams) => api.put(`/api/universes/${universeId}/harmony`, {
    harmony_params: harmonyParams
  }),

  // Scene methods
  getScenes: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.universeId) {
      queryParams.append('universe_id', params.universeId);
    }
    return api.get(`${endpoints.scenes.list}?${queryParams.toString()}`);
  },
  getScene: (id) => api.get(endpoints.scenes.get(id)),
  createScene: (data) => api.post(endpoints.scenes.create, data),
  updateScene: (id, data) => api.put(endpoints.scenes.update(id), data),
  deleteScene: (id) => api.delete(endpoints.scenes.delete(id)),
  reorderScenes: (data) => api.post(endpoints.scenes.reorder, data),
  updateScenePhysicsParams: (sceneId, data) => api.put(`${endpoints.scenes.get(sceneId)}/physics_parameters`, data),
  updateSceneHarmonyParams: (sceneId, data) => api.put(`${endpoints.scenes.get(sceneId)}/harmony_parameters`, data),

  // Physics Objects methods
  getPhysicsObjects: () => api.get(endpoints.physicsObjects.list),
  createPhysicsObject: (data) => api.post(endpoints.physicsObjects.create, data),
  getPhysicsObject: (id) => api.get(endpoints.physicsObjects.get(id)),
  updatePhysicsObject: (id, data) => api.put(endpoints.physicsObjects.update(id), data),
  deletePhysicsObject: (id) => api.delete(endpoints.physicsObjects.delete(id)),
  getPhysicsObjectsForScene: (sceneId) => api.get(endpoints.physicsObjects.forScene(sceneId))
};

// Export the api instance directly
export { api };

export default apiClient;
