import axios from "axios";
import { AUTH_CONFIG } from "../utils/config";
import { log } from "../utils/logger";
import { endpoints } from "./endpoints";
import { cache } from "../utils/cache";
import { CACHE_CONFIG } from "../utils/cacheConfig";

// Create axios instance with base configuration
const api = axios.create({
  baseURL: "", // Remove base URL since it's included in endpoints
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: false, // Disable credentials for now
  timeout: 15000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Log request
    log("api", "Sending request", {
      method: config.method.toUpperCase(),
      url: config.url,
      data: config.data,
      headers: config.headers,
    });

    // Add auth token if available
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Remove credentials from login request
    if (config.url.includes("/auth/login")) {
      config.withCredentials = false;
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
      data: response.data,
      headers: response.headers,
    });

    return response;
  },
  async (error) => {
    const status = error.response?.status;
    const url = error.config?.url;
    const data = error.response?.data;

    // Log error
    log("api", "Response error", {
      status,
      url,
      message: error.message,
      response: data,
      request: error.config?.data,
      headers: error.response?.headers,
    });

    // Handle token refresh
    if (status === 401 && !url.includes("/auth/login")) {
      try {
        const refreshToken = localStorage.getItem(
          AUTH_CONFIG.REFRESH_TOKEN_KEY
        );
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
      // Only clear tokens if it's not a login attempt
      if (!url.includes("/auth/login")) {
        localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
        localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
      }

      // Return a more descriptive error
      return Promise.reject({
        message: data?.message || "Invalid email or password",
        status: 401,
        data: data,
      });
    }

    return Promise.reject(error);
  }
);

// API methods
export const apiClient = {
  // Auth methods
  login: (credentials) => api.post(endpoints.auth.login, credentials),
  register: (userData) => api.post(endpoints.auth.register, userData),
  demoLogin: () => api.post(endpoints.auth.demoLogin),
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

      // Log the response for debugging
      log("api", "User profile response", { response: response?.data });

      // Handle different response structures
      let profileData;
      if (response?.data?.profile) {
        profileData = response.data.profile;
      } else if (response?.data?.user) {
        profileData = response.data.user;
      } else if (response?.data) {
        profileData = response.data;
      } else {
        throw new Error("Invalid response structure from user profile endpoint");
      }

      // Cache the profile data
      cache.set(
        CACHE_CONFIG.USER_PROFILE.key,
        profileData,
        CACHE_CONFIG.USER_PROFILE.ttl
      );

      // Return the response in the expected format
      return {
        data: {
          message: "User profile retrieved successfully",
          profile: profileData,
        },
      };
    } catch (error) {
      log("api", "Error fetching user profile", {
        error: error.message,
        response: error.response?.data
      });
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
