import axios from "axios";
import { shouldUseFallback } from "../utils/authFallback";
import {
  API_CONFIG,
  AUTH_CONFIG,
  API_URL,
  IS_DEVELOPMENT,
} from "../utils/config";

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_URL,
  timeout: API_CONFIG.TIMEOUT || 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
});

// Test API connection on startup
const testApiConnection = async () => {
  try {
    if (IS_DEVELOPMENT) {
      console.debug("Testing API connection to:", API_URL);
    }
    const response = await api.get("/health");
    if (IS_DEVELOPMENT) {
      console.debug("API connection successful:", response.data);
    }
    return true;
  } catch (error) {
    console.error("API connection failed:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      config: {
        baseURL: error.config?.baseURL,
        url: error.config?.url,
        method: error.config?.method,
      },
    });
    return false;
  }
};

// Test connection on startup
testApiConnection();

// Add request interceptor
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      if (IS_DEVELOPMENT) {
        console.debug(
          "Adding token to request:",
          token.substring(0, 10) + "..."
        );
        console.debug("Full request config:", {
          url: config.url,
          baseURL: config.baseURL,
          method: config.method,
          headers: config.headers,
          withCredentials: config.withCredentials,
        });
      }
    } else {
      if (IS_DEVELOPMENT) {
        console.debug("No token found in localStorage");
      }
    }

    // Log outgoing requests in development
    if (IS_DEVELOPMENT) {
      // Remove any leading /api from the URL to prevent duplication
      const cleanUrl = config.url.replace(/^\/api/, "");
      console.debug("API Request:", {
        method: config.method?.toUpperCase(),
        url: cleanUrl,
        baseURL: config.baseURL,
        fullURL: `${config.baseURL}${cleanUrl}`,
        data: config.data,
        headers: config.headers,
        withCredentials: config.withCredentials,
      });
    }
    return config;
  },
  (error) => {
    console.error("Request Error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor
api.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (IS_DEVELOPMENT) {
      console.debug("API Response:", {
        status: response.status,
        data: response.data,
        headers: response.headers,
        config: {
          url: response.config.url,
          baseURL: response.config.baseURL,
          method: response.config.method,
          headers: response.config.headers,
        },
      });
    }
    // Ensure response.data exists but don't modify the response structure
    if (!response.data) {
      response.data = {};
    }
    return response;
  },
  async (error) => {
    // Log error details in development
    if (IS_DEVELOPMENT) {
      console.error("API Error:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          baseURL: error.config?.baseURL,
          method: error.config?.method,
          headers: error.config?.headers,
          withCredentials: error.config?.withCredentials,
        },
      });
    }

    // Check if we should use fallback
    if (await shouldUseFallback(error)) {
      console.warn("Using fallback mode due to API error");
      // You can implement fallback logic here
    }

    // Format the error for better handling
    const formattedError = {
      message:
        error.response?.data?.message ||
        error.message ||
        "An unknown error occurred",
      status: error.response?.status,
      data: error.response?.data,
      config: error.config,
    };

    if (error.response?.status === 401) {
      localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
      window.location.href = "/login";
    }

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

// Add cache configuration
const CACHE_CONFIG = {
  USER_PROFILE: {
    key: "user_profile",
    ttl: 5 * 60 * 1000, // 5 minutes
  },
};

// Add cache utility functions
const cache = {
  set: (key, data, ttl) => {
    const item = {
      data,
      timestamp: Date.now(),
      ttl,
    };
    localStorage.setItem(key, JSON.stringify(item));
  },
  get: (key) => {
    const item = localStorage.getItem(key);
    if (!item) return null;

    const { data, timestamp, ttl } = JSON.parse(item);
    if (Date.now() - timestamp > ttl) {
      localStorage.removeItem(key);
      return null;
    }
    return data;
  },
  clear: (key) => {
    localStorage.removeItem(key);
  },
};

// API endpoints
export const endpoints = {
  auth: {
    login: "/auth/login",
    register: "/auth/register",
    logout: "/auth/logout",
    checkAuth: "/auth/check-auth",
    updateProfile: "/auth/profile",
    changePassword: "/auth/password",
    resetPassword: "/auth/reset-password",
    verifyEmail: "/auth/verify-email",
    demo: "/auth/demo",
    demoLogin: "/auth/demo-login",
    me: "/auth/me",
  },
  user: {
    profile: "/user/profile",
    settings: "/user/settings",
  },
  universes: {
    list: "/universes",
    create: "/universes",
    get: (id) => `/universes/${id}`,
    update: (id) => `/universes/${id}`,
    delete: (id) => `/universes/${id}`,
    scenes: (id) => `/universes/${id}/scenes`,
    duplicate: (id) => `/universes/${id}/duplicate`,
    export: (id) => `/universes/${id}/export`,
    import: "/universes/import",
    generate: "/universes/generate",
  },
  scenes: {
    list: "/scenes",
    create: "/scenes",
    get: (id) => `/scenes/${id}`,
    update: (id) => `/scenes/${id}`,
    delete: (id) => `/scenes/${id}`,
    reorder: "/scenes/reorder",
    duplicate: (id) => `/scenes/${id}/duplicate`,
    export: (id) => `/scenes/${id}/export`,
    import: "/scenes/import",
  },
  physicsObjects: {
    list: "/physics-objects",
    create: "/physics-objects",
    get: (id) => `/physics-objects/${id}`,
    update: (id) => `/physics-objects/${id}`,
    delete: (id) => `/physics-objects/${id}`,
    forScene: (sceneId) => `/scenes/${sceneId}/physics-objects`,
    simulate: "/physics-objects/simulate",
    reset: "/physics-objects/reset",
  },
  music: {
    generate: "/music/generate",
    save: "/music/save",
    list: "/music/list",
    upload: "/music/upload",
    delete: (id) => `/music/delete/${id}`,
  },
  physicsParameters: {
    get: "/physics-parameters",
    update: "/physics-parameters",
    reset: "/physics-parameters/reset",
  },
};

// API methods
export const apiClient = {
  // Auth methods
  login: (credentials) => api.post(endpoints.auth.login, credentials),
  register: (userData) => api.post(endpoints.auth.register, userData),
  logout: () => api.post(endpoints.auth.logout),
  checkAuth: () => api.get(endpoints.auth.me),
  demoLogin: () => api.post(endpoints.auth.demoLogin),

  // User methods
  getUserProfile: async () => {
    try {
      // Check cache first
      const cachedProfile = cache.get(CACHE_CONFIG.USER_PROFILE.key);
      if (cachedProfile) {
        console.debug("Using cached user profile");
        return {
          data: {
            message: "User profile retrieved successfully",
            profile: cachedProfile,
          },
        };
      }

      console.debug("Fetching fresh user profile");
      const response = await api.get(endpoints.user.profile);

      // Cache the response
      if (response?.data?.profile) {
        cache.set(
          CACHE_CONFIG.USER_PROFILE.key,
          response.data.profile,
          CACHE_CONFIG.USER_PROFILE.ttl
        );
      }

      return response;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      throw error;
    }
  },
  updateUserProfile: (data) => api.put(endpoints.user.profile, data),
  updateUserSettings: (settings) => api.put(endpoints.user.settings, settings),

  // Add method to clear user profile cache
  clearUserProfileCache: () => {
    cache.clear(CACHE_CONFIG.USER_PROFILE.key);
  },

  // Universe methods
  getUniverses: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.includePublic) {
      queryParams.append("public", "true");
    }
    return api.get(`${endpoints.universes.list}?${queryParams.toString()}`);
  },
  createUniverse: (data) => api.post(endpoints.universes.create, data),
  getUniverse: (id, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.includeScenes) {
      queryParams.append("include_scenes", "true");
    }
    return api.get(`${endpoints.universes.get(id)}?${queryParams.toString()}`);
  },
  updateUniverse: (id, data) => api.put(endpoints.universes.update(id), data),
  deleteUniverse: (id) => api.delete(endpoints.universes.delete(id)),
  getUniverseScenes: (universeId) =>
    api.get(endpoints.universes.scenes(universeId)),
  updateUniversePhysics: (universeId, physicsParams) =>
    api.put(`/api/universes/${universeId}/physics`, {
      physics_params: physicsParams,
    }),
  updateUniverseHarmony: (universeId, harmonyParams) =>
    api.put(`/api/universes/${universeId}/harmony`, {
      harmony_params: harmonyParams,
    }),

  // Scene methods
  getScenes: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.universeId) {
      queryParams.append("universe_id", params.universeId);
    }
    return api.get(`${endpoints.scenes.list}?${queryParams.toString()}`);
  },
  getScene: (id) => api.get(endpoints.scenes.get(id)),
  createScene: (data) => api.post(endpoints.scenes.create, data),
  updateScene: (id, data) => api.put(endpoints.scenes.update(id), data),
  deleteScene: (id) => api.delete(endpoints.scenes.delete(id)),
  reorderScenes: (data) => api.post(endpoints.scenes.reorder, data),
  updateScenePhysicsParams: (sceneId, data) =>
    api.put(`${endpoints.scenes.get(sceneId)}/physics_parameters`, data),
  updateSceneHarmonyParams: (sceneId, data) =>
    api.put(`${endpoints.scenes.get(sceneId)}/harmony_parameters`, data),

  // Physics Objects methods
  getPhysicsObjects: () => api.get(endpoints.physicsObjects.list),
  createPhysicsObject: (data) =>
    api.post(endpoints.physicsObjects.create, data),
  getPhysicsObject: (id) => api.get(endpoints.physicsObjects.get(id)),
  updatePhysicsObject: (id, data) =>
    api.put(endpoints.physicsObjects.update(id), data),
  deletePhysicsObject: (id) => api.delete(endpoints.physicsObjects.delete(id)),
  getPhysicsObjectsForScene: (sceneId) =>
    api.get(endpoints.physicsObjects.forScene(sceneId)),

  // Music methods
  generateMusic: (data) => api.post(endpoints.music.generate, data),
  saveMusic: (data) => api.post(endpoints.music.save, data),
  getMusicList: () => api.get(endpoints.music.list),
  uploadMusic: (data) => api.post(endpoints.music.upload, data),
  deleteMusic: (id) => api.delete(endpoints.music.delete(id)),

  // Physics parameters methods
  updatePhysicsParameters: (params) =>
    api.post(endpoints.physicsParameters.update, params),
  getPhysicsParameters: () => api.get(endpoints.physicsParameters.get),
  resetPhysicsParameters: () => api.post(endpoints.physicsParameters.reset),
};

// Export the api instance directly
export { api };

export default apiClient;
