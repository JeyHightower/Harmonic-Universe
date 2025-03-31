import axios from "axios";
import { AUTH_CONFIG } from "../utils/config";
import { log } from "../utils/logger";
import { endpoints } from "./endpoints";
import { cache } from "../utils/cache";
import { CACHE_CONFIG } from "../utils/cacheConfig";

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
  timeout: 15000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Log request
    log("api", "Sending request", {
      method: config.method.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
    });

    // Add auth token if available
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    log("api", "Request error", { error: error.message });
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Log successful response
    log("api", "Response received", {
      status: response.status,
      url: response.config.url,
    });

    return response;
  },
  async (error) => {
    const status = error.response?.status;
    const url = error.config?.url;

    // Log error
    log("api", "Response error", {
      status,
      url,
      message: error.message,
      response: error.response?.data,
    });

    // Handle token refresh
    if (status === 401 && !url.includes("/auth/login")) {
      try {
        const refreshToken = localStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
        if (refreshToken) {
          const response = await api.post(endpoints.auth.refresh, {
            refresh_token: refreshToken,
          });
          const { access_token } = response.data;
          localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, access_token);
          error.config.headers.Authorization = `Bearer ${access_token}`;
          return api(error.config);
        }
      } catch (refreshError) {
        log("api", "Token refresh failed", { error: refreshError.message });
      }
    }

    // Handle unauthorized access
    if (status === 401) {
      localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
      localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
      window.location.href = "/#/?modal=login&authError=true";
    }

    return Promise.reject(error);
  }
);

// API methods
export const apiClient = {
  // Auth methods
  login: (credentials) => api.post(endpoints.auth.login, credentials),
  register: (userData) => api.post(endpoints.auth.register, userData),
  logout: () => {
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    return api.post(
      endpoints.auth.logout,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  },
  checkAuth: () => api.get(endpoints.auth.me),

  // User methods
  getUserProfile: async () => {
    try {
      // Check cache first
      const cachedProfile = cache.get(CACHE_CONFIG.USER_PROFILE.key);
      if (cachedProfile) {
        return {
          data: {
            message: "User profile retrieved successfully",
            profile: cachedProfile,
          },
        };
      }

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
      log("api", "Error fetching user profile", { error: error.message });
      throw error;
    }
  },
  updateUserProfile: (data) => api.put(endpoints.user.profile, data),
  updateUserSettings: (settings) => api.put(endpoints.user.settings, settings),
  clearUserProfileCache: () => cache.clear(CACHE_CONFIG.USER_PROFILE.key),

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
