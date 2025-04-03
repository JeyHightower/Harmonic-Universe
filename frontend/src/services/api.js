import axios from "axios";
import { AUTH_CONFIG, API_CONFIG } from "../utils/config";
import { log } from "../utils/logger";
// Import each endpoint directly
import { endpoints, universesEndpoints } from "./endpoints";
import { cache } from "../utils/cache";
import { CACHE_CONFIG } from "../utils/cacheConfig";

// Define fallback image URL as a constant to reduce redundant network requests
const DEFAULT_SCENE_IMAGE = '/src/assets/images/default-scene.svg'; // Adjusted to use SVG

// Define direct fallbacks for critical endpoints
const FALLBACK_ENDPOINTS = {
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/signup',
    demoLogin: '/api/auth/demo-login',
    refresh: '/api/auth/refresh',
    logout: '/api/auth/logout',
    validate: '/api/auth/validate'
  },
  universes: {
    list: '/api/universes',
    create: '/api/universes',
    get: (id) => `/api/universes/${id}`,
    update: (id) => `/api/universes/${id}`,
    delete: (id) => `/api/universes/${id}`,
    scenes: (id) => {
      // Log a deprecation warning
      console.warn(
        `[Deprecation Warning] The endpoint /api/universes/${id}/scenes is deprecated. ` +
        `Please use /api/scenes/universe/${id} instead.`
      );
      // Still use the legacy endpoint which will redirect to the primary endpoint
      return `/api/universes/${id}/scenes`;
    },
    characters: (id) => `/api/universes/${id}/characters`
  }
};

// Debug logs for endpoints
console.log("Endpoints loaded:", {
  universesEndpoints: universesEndpoints,
  endpoints,
  auth: endpoints?.auth,
  universes: endpoints?.universes || universesEndpoints,
  hasCreateUniverse: !!(endpoints?.universes?.create || universesEndpoints?.create),
  fallbacks: FALLBACK_ENDPOINTS
});

// Use a direct universes object that combines all sources
const universes = endpoints?.universes || universesEndpoints || FALLBACK_ENDPOINTS.universes;

// Helper function to safely get endpoints with fallbacks
const getEndpoint = (group, name, fallback) => {
  try {
    // Direct handling for universes group
    if (group === 'universes') {
      if (universes && universes[name]) {
        return universes[name];
      }
      return fallback;
    }

    if (!endpoints) {
      console.warn(`Endpoints object is ${typeof endpoints}, using fallback`);
      // Try to use our direct fallbacks first
      if (FALLBACK_ENDPOINTS[group] && FALLBACK_ENDPOINTS[group][name]) {
        return FALLBACK_ENDPOINTS[group][name];
      }
      return fallback;
    }

    if (!endpoints[group]) {
      console.warn(`Endpoint group '${group}' not found, using fallback`);
      // Try to use our direct fallbacks first
      if (FALLBACK_ENDPOINTS[group] && FALLBACK_ENDPOINTS[group][name]) {
        return FALLBACK_ENDPOINTS[group][name];
      }
      return fallback;
    }

    if (!endpoints[group][name]) {
      console.warn(`Endpoint '${name}' not found in group '${group}', using fallback`);
      // Try to use our direct fallbacks first
      if (FALLBACK_ENDPOINTS[group] && FALLBACK_ENDPOINTS[group][name]) {
        return FALLBACK_ENDPOINTS[group][name];
      }
      return fallback;
    }

    return endpoints[group][name];
  } catch (error) {
    console.error(`Error accessing endpoint ${group}.${name}:`, error);
    // Try to use our direct fallbacks first
    if (FALLBACK_ENDPOINTS[group] && FALLBACK_ENDPOINTS[group][name]) {
      return FALLBACK_ENDPOINTS[group][name];
    }
    return fallback;
  }
};

// Request deduplication
const pendingRequests = new Map();

// Check for environment-specific API URL
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://harmonic-universe-v682.onrender.com'
  : 'http://localhost:5001'; // Updated port from 5000 to 5001

// Create axios instance with the API base URL
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: API_CONFIG.HEADERS,
  timeout: API_CONFIG.TIMEOUT,
  withCredentials: true,  // Always include credentials
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
      withCredentials: config.withCredentials,
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
  login: (credentials) => axiosInstance.post(getEndpoint('auth', 'login', '/api/auth/login'), credentials),
  register: (userData) => axiosInstance.post(getEndpoint('auth', 'register', '/api/auth/signup'), userData),
  demoLogin: () => {
    const endpoint = getEndpoint('auth', 'demoLogin', '/api/auth/demo-login');
    console.log("API: Making demo login request to", endpoint);
    return axiosInstance.post(endpoint);
  },
  validateToken: async () => {
    try {
      console.log("Attempting to validate token");
      const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);

      if (!token) {
        console.log("No token found in localStorage");
        throw new Error("No token available");
      }

      // Try the auth validate endpoint - this now exists so we don't need fallbacks
      console.log("Trying auth validate endpoint:", getEndpoint('auth', 'validate', '/api/auth/validate'));
      const response = await axiosInstance.get(getEndpoint('auth', 'validate', '/api/auth/validate'));
      console.log("Validate endpoint response:", response.data);

      return {
        data: {
          message: "Token validation successful",
          user: response.data.user || response.data
        }
      };
    } catch (error) {
      log("api", "Token validation failed", {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  },
  refreshToken: async () => {
    const refreshToken = localStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }
    return axiosInstance.post(getEndpoint('auth', 'refresh', '/api/auth/refresh'), { refresh_token: refreshToken });
  },
  logout: () => {
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    return axiosInstance.post(
      getEndpoint('auth', 'logout', '/api/auth/logout'),
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
      const response = await axiosInstance.get(getEndpoint('user', 'profile', '/api/user/profile'));
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

      const response = await axiosInstance.get(getEndpoint('user', 'profile', '/api/user/profile'));
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
  updateUserProfile: (data) => axiosInstance.put(getEndpoint('user', 'profile', '/api/user/profile'), data),
  updateUserSettings: (settings) => axiosInstance.put(getEndpoint('user', 'settings', '/api/user/settings'), settings),
  clearUserProfileCache: () => cache.clear(CACHE_CONFIG.USER_PROFILE.key),

  // Universe methods
  getUniverses: async (params = {}) => {
    console.log("API - Getting universes with params:", params);

    // Build query parameters
    const queryParams = new URLSearchParams();
    if (params.userId) {
      queryParams.append('user_id', params.userId);
    }
    if (params.public) {
      queryParams.append('public', params.public);
    }
    if (params.user_only) {
      queryParams.append('user_only', params.user_only);
    }

    // Get endpoint with fallback
    const baseEndpoint = getEndpoint('universes', 'list', '/api/universes');

    // Construct URL with query parameters
    const url = queryParams.toString()
      ? `${baseEndpoint}?${queryParams.toString()}`
      : baseEndpoint;

    console.log("API - Fetching universes from URL:", url);

    try {
      const response = await axiosInstance.get(url);
      return response;
    } catch (error) {
      console.error("Error fetching universes:", {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        data: error.response?.data
      });

      // In development mode, return mock universes
      if (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') {
        console.log("Development mode: Returning mock universes");

        // Create some mock universe objects
        const mockUniverses = params.user_only ? [
          {
            id: 1001,
            name: "Demo Universe",
            description: "A demo universe for testing",
            is_public: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user_id: params.userId || 1
          }
        ] : [];

        return {
          status: 200,
          data: {
            message: "Universes retrieved successfully (mock)",
            universes: mockUniverses
          }
        };
      }

      // Return a formatted error for production
      const errorMsg = error.response?.data?.message || "Error retrieving universes";
      return {
        status: error.response?.status || 500,
        data: {
          error: error.response?.data?.error || error.message,
          message: errorMsg,
          universes: [] // Return empty array to avoid crashes
        }
      };
    }
  },
  createUniverse: async (data) => {
    console.log("API - Creating universe with data:", data);

    // Get endpoint with fallback
    const endpoint = getEndpoint('universes', 'create', '/api/universes');
    console.log("API - Using endpoint for universe creation:", endpoint);

    try {
      // First attempt with axios
      return await axiosInstance.post(endpoint, data);
    } catch (error) {
      // If the server returns 500 or other error, log the details
      console.error("Error creating universe:", {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        data: error.response?.data,
        serverError: error.response?.data?.error
      });

      // In development mode, return mock success response
      if (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') {
        console.log("Development mode: Returning mock universe creation response");

        // Create a mock universe object based on the submitted data
        const mockUniverse = {
          id: Math.floor(Math.random() * 10000),
          name: data.name,
          description: data.description || "",
          is_public: data.is_public !== undefined ? data.is_public : true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: 1, // Assuming this is the current user
        };

        return {
          status: 201,
          data: {
            message: "Universe created successfully (mock)",
            universe: mockUniverse
          }
        };
      }

      // Return a formatted error for production
      const errorMsg = error.response?.data?.message || "Error creating universe";
      return {
        status: error.response?.status || 500,
        data: {
          error: error.response?.data?.error || error.message,
          message: errorMsg
        }
      };
    }
  },
  getUniverse: (id, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.includeScenes) {
      queryParams.append("include_scenes", "true");
    }

    // Get endpoint and ensure it's called if it's a function
    const endpoint = getEndpoint('universes', 'get', `/api/universes/${id}`);
    const url = typeof endpoint === 'function' ? endpoint(id) : endpoint;

    return axiosInstance.get(`${url}?${queryParams.toString()}`);
  },
  updateUniverse: async (id, data) => {
    console.log(`API - updateUniverse - Updating universe ${id} with data:`, data);
    try {
      const response = await axiosInstance.put(`/api/universes/${id}`, data);
      console.log(`API - updateUniverse - Successfully updated universe ${id}:`, response);
      return response;
    } catch (error) {
      console.error(`API - updateUniverse - Error updating universe ${id}:`, error.response || error);
      // Re-throw the error to be handled by the calling code
      throw error;
    }
  },
  deleteUniverse: async (id) => {
    console.log(`API - deleteUniverse - Deleting universe ${id}`);
    try {
      const response = await axiosInstance.delete(`/api/universes/${id}`);
      console.log(`API - deleteUniverse - Successfully deleted universe ${id}:`, response);
      return response;
    } catch (error) {
      console.error(`API - deleteUniverse - Error deleting universe ${id}:`, error.response || error);
      // Re-throw the error to be handled by the calling code
      throw error;
    }
  },
  getUniverseScenes: (universeId) => {
    // Use the recommended endpoint instead of the deprecated one
    // const endpoint = getEndpoint('universes', 'scenes', `/api/universes/${universeId}/scenes`);
    const endpoint = getEndpoint('scenes', 'byUniverse', `/api/scenes/universe/${universeId}`);
    const url = typeof endpoint === 'function' ? endpoint(universeId) : endpoint;

    console.log("Using new scenes endpoint:", url);

    // Return a promise that handles errors more gracefully
    return new Promise((resolve, reject) => {
      axiosInstance.get(url)
        .then(response => {
          console.log("Universe scenes API response:", response);
          resolve(response);
        })
        .catch(error => {
          console.error(`Error fetching scenes for universe ${universeId}:`, error);

          // If the new endpoint fails, use direct API call as fallback
          console.log(`Falling back to direct scenes endpoint for universe ${universeId}`);

          // Avoid circular reference to apiClient.getScenes
          // Instead use axiosInstance directly with the scenes endpoint
          const fallbackUrl = `/api/scenes?universe_id=${universeId}`;
          console.log("Using fallback URL:", fallbackUrl);

          axiosInstance.get(fallbackUrl)
            .then(fallbackResponse => {
              console.log("Fallback direct scenes response:", fallbackResponse);
              resolve(fallbackResponse);
            })
            .catch(fallbackError => {
              console.error(`Fallback also failed for universe ${universeId}:`, fallbackError);
              // Instead of rejecting, resolve with a well-formed error response
              resolve({
                status: error.response?.status || 500,
                data: {
                  scenes: [], // Always provide empty scenes array to prevent UI breakage
                  message: error.response?.data?.message || `Error fetching scenes for universe ${universeId}`,
                  error: error.response?.data?.error || error.message || "Unknown error"
                }
              });
            });
        });
    });
  },
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
    console.log("Getting scenes with params:", params);
    // Handle both direct universeId parameter and params object
    const queryParams = new URLSearchParams();

    // If params is a string or number, it's a direct universeId
    if (typeof params === 'string' || typeof params === 'number') {
      queryParams.append("universe_id", params);
      console.log("Direct universeId provided:", params);

      // Extra logging for problematic universes
      if (params == 6) {
        console.log("DETAILED DEBUG - Processing request for universe 6");
      }
    }
    // Otherwise treat it as a params object
    else if (params.universeId) {
      queryParams.append("universe_id", params.universeId);

      // Extra logging for problematic universes
      if (params.universeId == 6) {
        console.log("DETAILED DEBUG - Processing request for universe 6");
      }
    }

    // Get the base endpoint
    const baseEndpoint = getEndpoint('scenes', 'list', '/api/scenes');
    // Form the complete URL
    const url = `${baseEndpoint}?${queryParams.toString()}`;

    console.log("Fetching scenes from URL:", url);

    // Return a promise that handles errors more gracefully
    return new Promise((resolve, reject) => {
      axiosInstance.get(url)
        .then(response => {
          console.log("Scenes API response:", response);

          // Extra logging for problematic universes
          const universeId = typeof params === 'string' || typeof params === 'number' ? params : params.universeId;
          if (universeId == 6) {
            console.log("DETAILED DEBUG - Universe 6 successful response:", JSON.stringify(response.data));
          }

          resolve(response);
        })
        .catch(error => {
          console.error("Error fetching scenes:", error);

          // Extra logging for problematic universes
          const universeId = typeof params === 'string' || typeof params === 'number' ? params : params.universeId;
          if (universeId == 6) {
            console.error("DETAILED DEBUG - Universe 6 error details:", {
              message: error.message,
              stack: error.stack,
              response: error.response,
              request: error.request ? {
                url: error.request.url,
                status: error.request.status,
                responseType: error.request.responseType
              } : null
            });
          }

          // Instead of rejecting, resolve with a well-formed error response
          resolve({
            status: error.response?.status || 500,
            data: {
              scenes: [], // Always provide empty scenes array to prevent UI breakage
              message: error.response?.data?.message || "Error fetching scenes",
              error: error.response?.data?.error || error.message || "Unknown error"
            }
          });
        });
    });
  },
  getScene: (id) => {
    const endpoint = getEndpoint('scenes', 'get', `/api/scenes/${id}`);
    const url = typeof endpoint === 'function' ? endpoint(id) : endpoint;

    // Return a promise that handles errors more gracefully
    return new Promise((resolve, reject) => {
      axiosInstance.get(url)
        .then(response => {
          console.log(`Scene ${id} API response:`, response);
          resolve(response);
        })
        .catch(error => {
          console.error(`Error fetching scene ${id}:`, error);
          // Instead of rejecting, resolve with a well-formed error response
          resolve({
            status: error.response?.status || 500,
            data: {
              scene: {}, // Empty scene object to prevent UI breakage
              message: error.response?.data?.message || `Error fetching scene ${id}`,
              error: error.response?.data?.error || error.message || "Unknown error"
            }
          });
        });
    });
  },
  createScene: (data) => {
    // Ensure universe_id is present
    if (!data.universe_id) {
      throw new Error("universe_id is required to create a scene");
    }

    // Clone data and transform field names if needed
    const transformedData = { ...data };

    // Backend expects 'name' not 'title'
    if (transformedData.title && !transformedData.name) {
      transformedData.name = transformedData.title;
      delete transformedData.title;
    }

    // Add default image_url if missing to avoid server requests for default image
    if (!transformedData.image_url) {
      transformedData.image_url = DEFAULT_SCENE_IMAGE;
    }

    console.log("Sending createScene request with data:", transformedData);

    // Use the base scenes endpoint with error handling
    const endpoint = getEndpoint('scenes', 'list', '/api/scenes');

    // Return a promise that handles errors more gracefully
    return new Promise((resolve, reject) => {
      axiosInstance.post(endpoint, transformedData)
        .then(response => {
          console.log("Create scene API response:", response);

          // Ensure scene data has fallback image if missing
          if (response.data?.scene && !response.data.scene.image_url) {
            response.data.scene.image_url = DEFAULT_SCENE_IMAGE;
          }

          resolve(response);
        })
        .catch(error => {
          console.error("Error creating scene:", error);
          // Instead of rejecting, resolve with a well-formed error response
          resolve({
            status: error.response?.status || 500,
            data: {
              scene: {
                // Provide a minimal scene object with the original data
                ...transformedData,
                id: `temp_${Date.now()}`,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                image_url: DEFAULT_SCENE_IMAGE
              },
              message: error.response?.data?.message || "Error creating scene",
              error: error.response?.data?.error || error.message || "Unknown error"
            }
          });
        });
    });
  },
  updateScene: async (id, data) => {
    console.log(`API - updateScene - Updating scene ${id} with data:`, data);
    try {
      // Ensure we have all required fields
      if (!data.name) {
        throw new Error("Scene name is required");
      }

      if (!data.universe_id) {
        console.warn("API - updateScene - universe_id missing, adding from scene data");
        // Try to get universe_id from get scene if not provided
        const sceneEndpoint = getEndpoint('scenes', 'get', `/api/scenes/${id}`);
        const sceneResponse = await axiosInstance.get(sceneEndpoint);
        data.universe_id = sceneResponse.data?.scene?.universe_id || sceneResponse.data?.universe_id;

        if (!data.universe_id) {
          throw new Error("universe_id is required to update a scene");
        }
      }

      // Normalize data for API consistency
      const normalizedData = { ...data };

      // Ensure correct field names for API
      if (data.timeOfDay && !data.time_of_day) {
        normalizedData.time_of_day = data.timeOfDay;
      }

      if (data.characterIds && !data.character_ids) {
        normalizedData.character_ids = data.characterIds;
      }

      if (data.dateOfScene && !data.date_of_scene) {
        normalizedData.date_of_scene = data.dateOfScene;
      }

      console.log(`API - updateScene - Sending normalized data:`, normalizedData);
      const updateEndpoint = getEndpoint('scenes', 'update', `/api/scenes/${id}`);
      const updateUrl = typeof updateEndpoint === 'function' ? updateEndpoint(id) : updateEndpoint;
      const response = await axiosInstance.put(updateUrl, normalizedData);
      console.log(`API - updateScene - Successfully updated scene ${id}:`, response);
      return response;
    } catch (error) {
      console.error(`API - updateScene - Error updating scene ${id}:`, error.response || error);
      // Re-throw the error to be handled by the calling code
      throw error;
    }
  },
  deleteScene: async (id) => {
    console.log(`API - deleteScene - Deleting scene ${id}`);
    try {
      const endpoint = getEndpoint('scenes', 'delete', `/api/scenes/${id}`);
      const url = typeof endpoint === 'function' ? endpoint(id) : endpoint;
      const response = await axiosInstance.delete(url);
      console.log(`API - deleteScene - Successfully deleted scene ${id}:`, response);
      return response;
    } catch (error) {
      console.error(`API - deleteScene - Error deleting scene ${id}:`, error.response || error);
      // Re-throw the error to be handled by the calling code
      throw error;
    }
  },
  updateSceneHarmony: (sceneId, harmonyParams) =>
    axiosInstance.put(`/api/scenes/${sceneId}/harmony`, {
      harmony_params: harmonyParams,
    }),

  // Character methods
  getCharacters: (params = {}) => {
    console.log("Getting characters with params:", params);
    const queryParams = new URLSearchParams();

    // If params is a string or number, it's a direct universeId
    if (typeof params === 'string' || typeof params === 'number') {
      queryParams.append("universe_id", params);
    }
    // Otherwise treat it as a params object
    else if (params.universeId) {
      queryParams.append("universe_id", params.universeId);
    }

    // Get the base endpoint
    const baseEndpoint = getEndpoint('characters', 'list', '/api/characters');
    // Form the complete URL
    const url = `${baseEndpoint}?${queryParams.toString()}`;

    console.log("Fetching characters from URL:", url);
    return axiosInstance.get(url);
  },
  getCharactersByUniverse: (universeId) => {
    const endpoint = getEndpoint('universes', 'characters', `/api/universes/${universeId}/characters`);
    const url = typeof endpoint === 'function' ? endpoint(universeId) : endpoint;
    return axiosInstance.get(url);
  },
  getCharacter: (id) => {
    const endpoint = getEndpoint('characters', 'get', `/api/characters/${id}`);
    const url = typeof endpoint === 'function' ? endpoint(id) : endpoint;
    return axiosInstance.get(url);
  },
  createCharacter: (data) => {
    // Ensure universe_id is present
    if (!data.universe_id) {
      throw new Error("universe_id is required to create a character");
    }

    // Clone data and transform field names if needed
    const transformedData = { ...data };

    console.log("Sending createCharacter request with data:", transformedData);

    // Use the base characters endpoint
    const endpoint = getEndpoint('characters', 'create', '/api/characters');
    return axiosInstance.post(endpoint, transformedData);
  },
  updateCharacter: async (id, data) => {
    console.log(`API - updateCharacter - Updating character ${id} with data:`, data);
    try {
      // Ensure we have all required fields
      if (!data.name) {
        throw new Error("Character name is required");
      }

      if (!data.universe_id) {
        console.warn("API - updateCharacter - universe_id missing, adding from character data");
        // Try to get universe_id from get character if not provided
        const characterEndpoint = getEndpoint('characters', 'get', `/api/characters/${id}`);
        const characterUrl = typeof characterEndpoint === 'function' ? characterEndpoint(id) : characterEndpoint;
        const characterResponse = await axiosInstance.get(characterUrl);
        data.universe_id = characterResponse.data?.character?.universe_id || characterResponse.data?.universe_id;

        if (!data.universe_id) {
          throw new Error("universe_id is required to update a character");
        }
      }

      // Normalize data for API consistency
      const normalizedData = { ...data };

      console.log(`API - updateCharacter - Sending normalized data:`, normalizedData);
      const updateEndpoint = getEndpoint('characters', 'update', `/api/characters/${id}`);
      const updateUrl = typeof updateEndpoint === 'function' ? updateEndpoint(id) : updateEndpoint;
      const response = await axiosInstance.put(updateUrl, normalizedData);
      console.log(`API - updateCharacter - Successfully updated character ${id}:`, response);
      return response;
    } catch (error) {
      console.error(`API - updateCharacter - Error updating character ${id}:`, error.response || error);
      // Re-throw the error to be handled by the calling code
      throw error;
    }
  },
  deleteCharacter: async (id) => {
    console.log(`API - deleteCharacter - Deleting character ${id}`);
    try {
      const endpoint = getEndpoint('characters', 'delete', `/api/characters/${id}`);
      const url = typeof endpoint === 'function' ? endpoint(id) : endpoint;
      const response = await axiosInstance.delete(url);
      console.log(`API - deleteCharacter - Successfully deleted character ${id}:`, response);
      return response;
    } catch (error) {
      console.error(`API - deleteCharacter - Error deleting character ${id}:`, error.response || error);
      // Re-throw the error to be handled by the calling code
      throw error;
    }
  },

  // Note methods
  getNotes: (params = {}) => {
    console.log("Getting notes with params:", params);
    const queryParams = new URLSearchParams();

    // If params is a string or number, it's a direct universeId
    if (typeof params === 'string' || typeof params === 'number') {
      queryParams.append("universe_id", params);
    }
    // Otherwise treat it as a params object
    else if (params.universeId) {
      queryParams.append("universe_id", params.universeId);
    } else if (params.sceneId) {
      queryParams.append("scene_id", params.sceneId);
    } else if (params.characterId) {
      queryParams.append("character_id", params.characterId);
    }

    // Get the base endpoint
    const baseEndpoint = getEndpoint('notes', 'list', '/api/notes');
    // Form the complete URL
    const url = `${baseEndpoint}?${queryParams.toString()}`;

    console.log("Fetching notes from URL:", url);
    return axiosInstance.get(url);
  },
  getNotesByUniverse: (universeId) => {
    const endpoint = getEndpoint('notes', 'forUniverse', `/api/universes/${universeId}/notes`);
    const url = typeof endpoint === 'function' ? endpoint(universeId) : endpoint;
    return axiosInstance.get(url);
  },
  getNotesByScene: (sceneId) => {
    const endpoint = getEndpoint('notes', 'forScene', `/api/scenes/${sceneId}/notes`);
    const url = typeof endpoint === 'function' ? endpoint(sceneId) : endpoint;
    return axiosInstance.get(url);
  },
  getNotesByCharacter: (characterId) => {
    const endpoint = getEndpoint('notes', 'forCharacter', `/api/characters/${characterId}/notes`);
    const url = typeof endpoint === 'function' ? endpoint(characterId) : endpoint;
    return axiosInstance.get(url);
  },
  getNote: (id) => {
    const endpoint = getEndpoint('notes', 'get', `/api/notes/${id}`);
    const url = typeof endpoint === 'function' ? endpoint(id) : endpoint;
    return axiosInstance.get(url);
  },
  createNote: (data) => {
    // Clone data and transform field names if needed
    const transformedData = { ...data };

    // Ensure we have the appropriate parent ID
    if (!transformedData.universe_id && !transformedData.scene_id && !transformedData.character_id) {
      throw new Error("At least one parent ID (universe_id, scene_id, or character_id) is required to create a note");
    }

    console.log("Sending createNote request with data:", transformedData);

    // Use the base notes endpoint
    const endpoint = getEndpoint('notes', 'create', '/api/notes');
    return axiosInstance.post(endpoint, transformedData);
  },
  updateNote: async (id, data) => {
    console.log(`API - updateNote - Updating note ${id} with data:`, data);
    try {
      // Ensure we have all required fields
      if (!data.title) {
        throw new Error("Note title is required");
      }

      // Normalize data for API consistency
      const normalizedData = { ...data };

      console.log(`API - updateNote - Sending normalized data:`, normalizedData);
      const updateEndpoint = getEndpoint('notes', 'update', `/api/notes/${id}`);
      const updateUrl = typeof updateEndpoint === 'function' ? updateEndpoint(id) : updateEndpoint;
      const response = await axiosInstance.put(updateUrl, normalizedData);
      console.log(`API - updateNote - Successfully updated note ${id}:`, response);
      return response;
    } catch (error) {
      console.error(`API - updateNote - Error updating note ${id}:`, error.response || error);
      // Re-throw the error to be handled by the calling code
      throw error;
    }
  },
  deleteNote: async (id) => {
    console.log(`API - deleteNote - Deleting note ${id}`);
    try {
      const endpoint = getEndpoint('notes', 'delete', `/api/notes/${id}`);
      const url = typeof endpoint === 'function' ? endpoint(id) : endpoint;
      const response = await axiosInstance.delete(url);
      console.log(`API - deleteNote - Successfully deleted note ${id}:`, response);
      return response;
    } catch (error) {
      console.error(`API - deleteNote - Error deleting note ${id}:`, error.response || error);
      // Re-throw the error to be handled by the calling code
      throw error;
    }
  },
};

export default apiClient;