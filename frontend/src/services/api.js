import axios from "axios";
import { AUTH_CONFIG, API_CONFIG } from "../utils/config";
import { log } from "../utils/logger";
import { endpoints } from "./endpoints";
import { cache } from "../utils/cache";
import { CACHE_CONFIG } from "../utils/cacheConfig";

// Request deduplication
const pendingRequests = new Map();

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: API_CONFIG.HEADERS,
  timeout: API_CONFIG.TIMEOUT,
  withCredentials: API_CONFIG.CORS.CREDENTIALS,
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);

    // Log request details
    console.debug("API Request:", {
      method: config.method,
      url: config.url,
      data: config.data,
      headers: config.headers,
      hasToken: !!token,
    });

    // Add token to headers if available
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Check for pending requests
    const requestKey = `${config.method}:${config.url}`;
    if (pendingRequests.has(requestKey)) {
      console.debug("Request already pending, returning existing promise");
      return Promise.reject({
        __deduplication: true,
        promise: pendingRequests.get(requestKey),
      });
    }

    // Store the request promise
    const promise = new Promise((resolve, reject) => {
      config.__resolve = resolve;
      config.__reject = reject;
    });
    pendingRequests.set(requestKey, promise);

    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    // Log response details
    console.debug("API Response:", {
      status: response.status,
      url: response.config.url,
      data: response.data,
      headers: response.headers,
    });

    // Clean up pending request
    const requestKey = `${response.config.method}:${response.config.url}`;
    pendingRequests.delete(requestKey);

    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle deduplication
    if (error.__deduplication) {
      console.debug("Request was deduplicated, returning existing promise");
      return error.promise;
    }

    // Log error details
    console.error("API Error:", {
      status: error.response?.status,
      url: originalRequest?.url,
      data: error.response?.data,
      headers: error.response?.headers,
    });

    // Clean up pending request
    if (originalRequest) {
      const requestKey = `${originalRequest.method}:${originalRequest.url}`;
      pendingRequests.delete(requestKey);
    }

    // Handle 401 errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Get refresh token
        const refreshToken = localStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);

        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        // Attempt to refresh token
        const response = await axiosInstance.post(AUTH_CONFIG.ENDPOINTS.REFRESH, {
          refresh_token: refreshToken,
        });

        // Store new tokens
        if (response.data.token) {
          localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, response.data.token);
        }
        if (response.data.refresh_token) {
          localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, response.data.refresh_token);
        }

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear tokens and redirect to login
        localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
        localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
        localStorage.removeItem(AUTH_CONFIG.USER_KEY);
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API methods
const apiClient = {
  // Auth methods
  login: (credentials) => axiosInstance.post(endpoints.auth.login, credentials),
  register: (userData) => axiosInstance.post(endpoints.auth.register, userData),
  demoLogin: () => axiosInstance.post(endpoints.auth.demoLogin),
  logout: () => {
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    return axiosInstance.post(
      endpoints.auth.logout,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  },
  checkAuth: async () => {
    try {
      const response = await axiosInstance.get(endpoints.user.profile);
      return {
        data: {
          message: "Authentication check successful",
          user: response.data.profile
        }
      };
    } catch (error) {
      log("api", "Auth check failed", {
        error: error.message,
        response: error.response?.data
      });
      throw error;
    }
  },

  // User methods
  getUserProfile: async () => {
    try {
      // Check cache first
      const cachedProfile = cache.get(CACHE_CONFIG.USER_PROFILE.key);
      if (cachedProfile) {
        log("api", "Using cached user profile", { profile: cachedProfile });
        return {
          data: {
            message: "User profile retrieved from cache",
            profile: cachedProfile,
          },
        };
      }

      const response = await axiosInstance.get(endpoints.user.profile);
      log("api", "Raw user profile response", { response });

      // Extract profile data with fallbacks
      let profileData = null;

      if (response?.data?.profile) {
        profileData = response.data.profile;
      } else if (response?.data?.user) {
        profileData = response.data.user;
      } else if (typeof response?.data === 'object' && response.data !== null) {
        // If response.data is an object and contains user-like properties, use it
        const { message, error, ...rest } = response.data;
        if (rest.id || rest.username || rest.email) {
          profileData = rest;
        }
      }

      if (!profileData) {
        throw new Error("Could not extract valid profile data from response");
      }

      // Cache the profile data
      cache.set(
        CACHE_CONFIG.USER_PROFILE.key,
        profileData,
        CACHE_CONFIG.USER_PROFILE.ttl
      );

      log("api", "Processed user profile data", { profileData });

      return {
        data: {
          message: "User profile retrieved successfully",
          profile: profileData,
        },
      };
    } catch (error) {
      log("api", "Error fetching user profile", {
        error: error.message,
        response: error.response?.data,
        stack: error.stack,
      });
      throw error;
    }
  },
  updateUserProfile: (data) => axiosInstance.put(endpoints.user.profile, data),
  updateUserSettings: (settings) => axiosInstance.put(endpoints.user.settings, settings),
  clearUserProfileCache: () => cache.clear(CACHE_CONFIG.USER_PROFILE.key),

  // Universe methods
  getUniverses: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.includePublic) {
      queryParams.append("public", "true");
    }
    return axiosInstance.get(`${endpoints.universes.list}?${queryParams.toString()}`);
  },
  createUniverse: (data) => axiosInstance.post(endpoints.universes.create, data),
  getUniverse: (id, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.includeScenes) {
      queryParams.append("include_scenes", "true");
    }
    return axiosInstance.get(`${endpoints.universes.get(id)}?${queryParams.toString()}`);
  },
  updateUniverse: (id, data) => axiosInstance.put(endpoints.universes.update(id), data),
  deleteUniverse: (id) => axiosInstance.delete(endpoints.universes.delete(id)),
  getUniverseScenes: (universeId) =>
    axiosInstance.get(endpoints.universes.scenes(universeId)),
  updateUniversePhysics: (universeId, physicsParams) =>
    axiosInstance.put(`/api/universes/${universeId}/physics`, {
      physics_params: physicsParams,
    }),
  updateUniverseHarmony: (universeId, harmonyParams) =>
    axiosInstance.put(`/api/universes/${universeId}/harmony`, {
      harmony_params: harmonyParams,
    }),

  // Scene methods
  getScenes: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.universeId) {
      queryParams.append("universe_id", params.universeId);
    }
    return axiosInstance.get(`${endpoints.scenes.list}?${queryParams.toString()}`);
  },
  getScene: (id) => axiosInstance.get(endpoints.scenes.get(id)),
  createScene: (data) => axiosInstance.post(endpoints.scenes.create, data),
  updateScene: (id, data) => axiosInstance.put(endpoints.scenes.update(id), data),
  deleteScene: (id) => axiosInstance.delete(endpoints.scenes.delete(id)),
  reorderScenes: (data) => axiosInstance.post(endpoints.scenes.reorder, data),
  updateScenePhysicsParams: (sceneId, data) =>
    axiosInstance.put(`${endpoints.scenes.get(sceneId)}/physics_parameters`, data),
  updateSceneHarmonyParams: (sceneId, data) =>
    axiosInstance.put(`${endpoints.scenes.get(sceneId)}/harmony_parameters`, data),

  // Physics Objects methods
  getPhysicsObjects: () => axiosInstance.get(endpoints.physicsObjects.list),
  createPhysicsObject: (data) =>
    axiosInstance.post(endpoints.physicsObjects.create, data),
  getPhysicsObject: (id) => axiosInstance.get(endpoints.physicsObjects.get(id)),
  updatePhysicsObject: (id, data) =>
    axiosInstance.put(endpoints.physicsObjects.update(id), data),
  deletePhysicsObject: (id) => axiosInstance.delete(endpoints.physicsObjects.delete(id)),
  getPhysicsObjectsForScene: (sceneId) =>
    axiosInstance.get(endpoints.physicsObjects.forScene(sceneId)),

  // Music methods
  generateMusic: (data) => axiosInstance.post(endpoints.music.generate, data),
  saveMusic: (data) => axiosInstance.post(endpoints.music.save, data),
  getMusicList: () => axiosInstance.get(endpoints.music.list),
  uploadMusic: (data) => axiosInstance.post(endpoints.music.upload, data),
  deleteMusic: (id) => axiosInstance.delete(endpoints.music.delete(id)),

  // Physics parameters methods
  updatePhysicsParameters: (params) =>
    axiosInstance.post(endpoints.physicsParameters.update, params),
  getPhysicsParameters: () => axiosInstance.get(endpoints.physicsParameters.get),
  resetPhysicsParameters: () => axiosInstance.post(endpoints.physicsParameters.reset),
};

export default apiClient;
