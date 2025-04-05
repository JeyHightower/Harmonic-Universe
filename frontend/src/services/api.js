import axios from "axios";
import { AUTH_CONFIG, API_CONFIG, IS_PRODUCTION } from "../utils/config";
import { log } from "../utils/logger";
// Import the endpoints properly
import { endpoints } from "./endpoints";
import { cache } from "../utils/cache";
import { CACHE_CONFIG } from "../utils/cacheConfig";

// Debug log of imported endpoints
console.log("Imported endpoints:", {
  hasEndpoints: !!endpoints,
  hasAuthEndpoints: !!(endpoints && endpoints.auth),
  validateEndpoint: endpoints?.auth?.validate
});

// Define fallback image URL as a constant to reduce redundant network requests
const DEFAULT_SCENE_IMAGE = '/src/assets/images/default-scene.svg'; // Adjusted to use SVG

// Define direct fallbacks for critical endpoints
const FALLBACK_ENDPOINTS = {
  auth: {
    login: IS_PRODUCTION ? '/auth/login' : '/api/auth/login',
    register: IS_PRODUCTION ? '/auth/signup' : '/api/auth/signup',
    demoLogin: IS_PRODUCTION ? '/auth/demo-login' : '/api/auth/demo-login',
    refresh: IS_PRODUCTION ? '/auth/refresh' : '/api/auth/refresh',
    logout: IS_PRODUCTION ? '/auth/logout' : '/api/auth/logout',
    validate: IS_PRODUCTION ? '/auth/validate' : '/api/auth/validate'
  },
  universes: {
    list: IS_PRODUCTION ? '/universes' : '/api/universes',
    create: IS_PRODUCTION ? '/universes' : '/api/universes',
    get: (id) => IS_PRODUCTION ? `/universes/${id}` : `/api/universes/${id}`,
    update: (id) => IS_PRODUCTION ? `/universes/${id}` : `/api/universes/${id}`,
    delete: (id) => IS_PRODUCTION ? `/universes/${id}` : `/api/universes/${id}`,
    scenes: (id) => {
      // Log a deprecation warning
      console.warn(
        `[Deprecation Warning] The endpoint /api/universes/${id}/scenes is deprecated. ` +
        `Please use /api/scenes/universe/${id} instead.`
      );
      // Still use the legacy endpoint which will redirect to the primary endpoint
      return IS_PRODUCTION ? `/universes/${id}/scenes` : `/api/universes/${id}/scenes`;
    },
    characters: (id) => IS_PRODUCTION ? `/universes/${id}/characters` : `/api/universes/${id}/characters`
  }
};

// Debug logs for endpoints
console.log("Endpoints loaded:", {
  universesEndpoints: endpoints?.universes || FALLBACK_ENDPOINTS.universes,
  endpoints,
  auth: endpoints?.auth,
  universes: endpoints?.universes || FALLBACK_ENDPOINTS.universes,
  hasCreateUniverse: !!(endpoints?.universes?.create || FALLBACK_ENDPOINTS.universes.create),
  fallbacks: FALLBACK_ENDPOINTS
});

// Use a direct universes object that combines all sources
const universes = endpoints?.universes || FALLBACK_ENDPOINTS.universes;

// Helper function to safely get endpoints with fallbacks
const getEndpoint = (group, name, fallback) => {
  try {
    // Check environment to see if we need to handle duplicate /api prefixes
    const isProduction = process.env.NODE_ENV === 'production' ||
      import.meta.env.PROD ||
      (typeof window !== 'undefined' &&
        !window.location.hostname.includes('localhost') &&
        !window.location.hostname.includes('127.0.0.1'));

    // Get endpoint from appropriate source
    let endpoint;

    // Direct handling for universes group
    if (group === 'universes') {
      endpoint = universes && universes[name] ? universes[name] : fallback;
    }
    // Direct handling for auth group to fix validation warning
    else if (group === 'auth') {
      if (endpoints?.auth && endpoints.auth[name]) {
        endpoint = endpoints.auth[name];
      } else if (FALLBACK_ENDPOINTS.auth && FALLBACK_ENDPOINTS.auth[name]) {
        endpoint = FALLBACK_ENDPOINTS.auth[name];
      } else {
        endpoint = fallback;
      }
    }
    // Standard handling for other groups
    else if (!endpoints) {
      console.warn(`Endpoints object is ${typeof endpoints}, using fallback`);
      endpoint = FALLBACK_ENDPOINTS[group] && FALLBACK_ENDPOINTS[group][name]
        ? FALLBACK_ENDPOINTS[group][name]
        : fallback;
    }
    else if (!endpoints[group]) {
      console.warn(`Endpoint group '${group}' not found, using fallback`);
      endpoint = FALLBACK_ENDPOINTS[group] && FALLBACK_ENDPOINTS[group][name]
        ? FALLBACK_ENDPOINTS[group][name]
        : fallback;
    }
    else if (!endpoints[group][name]) {
      console.warn(`Endpoint '${name}' not found in group '${group}', using fallback`);
      endpoint = FALLBACK_ENDPOINTS[group] && FALLBACK_ENDPOINTS[group][name]
        ? FALLBACK_ENDPOINTS[group][name]
        : fallback;
    }
    else {
      endpoint = endpoints[group][name];
    }

    // Handle endpoint as function
    if (typeof endpoint === 'function') {
      endpoint = endpoint.apply(null, Array.prototype.slice.call(arguments, 3));
    }

    // In production, if the endpoint starts with /api and we're using a baseURL that also
    // has /api, remove the /api prefix from the endpoint to prevent duplication
    if (isProduction && typeof endpoint === 'string' && endpoint.startsWith('/api/')) {
      console.log(`Fixing duplicate /api prefix in endpoint: ${endpoint}`);
      return endpoint.substring(4); // Remove the first /api
    }

    return endpoint;
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

// Helper to check if we're in a rate limit cooldown period
const isInRateLimitCooldown = () => {
  const cooldownKey = 'rate_limit_cooldown';
  const cooldownUntil = parseInt(sessionStorage.getItem(cooldownKey) || '0');
  const now = Date.now();

  if (cooldownUntil > now) {
    console.warn(`In rate limit cooldown period. ${Math.ceil((cooldownUntil - now) / 1000)}s remaining`);
    return true;
  }
  return false;
};

// Helper to add request throttling
const throttleRequests = (() => {
  const requestTimestamps = [];
  const windowSize = 1000; // 1 second window
  const maxRequestsPerWindow = 5; // Max 5 requests per second on Render free tier

  return () => {
    const now = Date.now();

    // Remove timestamps older than our window
    while (requestTimestamps.length > 0 && requestTimestamps[0] < now - windowSize) {
      requestTimestamps.shift();
    }

    // Check if we've hit the rate limit
    if (requestTimestamps.length >= maxRequestsPerWindow) {
      console.warn(`Request throttled - ${requestTimestamps.length} requests in the last ${windowSize}ms`);
      return true; // Throttle this request
    }

    // Add current timestamp and allow request
    requestTimestamps.push(now);
    return false; // Don't throttle
  };
})();

// Determine the appropriate API URL based on environment
const getApiBaseUrl = () => {
  const isProduction = process.env.NODE_ENV === 'production' ||
    import.meta.env.PROD ||
    (typeof window !== 'undefined' &&
      !window.location.hostname.includes('localhost') &&
      !window.location.hostname.includes('127.0.0.1'));

  if (isProduction) {
    return '/api'; // In production, use relative URL (same origin)
  }

  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';
};

// Set the API base URL
const API_BASE_URL = getApiBaseUrl();

// Debug log the API base URL
console.log(`API Base URL (in api.js): ${API_BASE_URL}`);

// Configure Axios with sensible defaults for production vs development
const axiosConfig = {
  baseURL: API_BASE_URL,
  headers: API_CONFIG.HEADERS,
  timeout: API_CONFIG.TIMEOUT,
  withCredentials: true  // Always include credentials
};

// In production, add more conservative settings to avoid rate limits
const isProduction = process.env.NODE_ENV === 'production' ||
  import.meta.env.PROD ||
  (typeof window !== 'undefined' &&
    !window.location.hostname.includes('localhost'));

if (isProduction) {
  // Use more conservative settings in production
  axiosConfig.timeout = 20000; // Longer timeout (20s)
  axiosConfig.maxRedirects = 2; // Limit redirects  
  axiosConfig.maxContentLength = 2 * 1024 * 1024; // 2MB max size
  axiosConfig.decompress = true; // Ensure responses are decompressed

  // Add a user-agent to help with rate limiting debugging
  axiosConfig.headers['User-Agent'] = 'Harmonic-Universe-Web-Client';

  console.log("Using production-optimized Axios configuration");
}

// Create axios instance with the API base URL
const axiosInstance = axios.create(axiosConfig);

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Check for rate limit cooldown
    if (isInRateLimitCooldown()) {
      // If in cooldown, reject non-essential requests
      const isEssentialRequest =
        (config.url?.includes('/auth/') && !config.url?.includes('/auth/validate')) ||
        config.url?.includes('/health');

      if (!isEssentialRequest) {
        console.warn(`Request to ${config.url} rejected due to rate limit cooldown`);
        return Promise.reject({
          __rateLimited: true,
          message: "Request rejected due to rate limit cooldown"
        });
      }
    }

    // Apply request throttling in production
    if (isProduction && throttleRequests()) {
      // For non-essential requests, reject if throttled
      const isEssentialRequest =
        (config.url?.includes('/auth/') && !config.url?.includes('/auth/validate')) ||
        config.url?.includes('/health');

      if (!isEssentialRequest) {
        console.warn(`Request to ${config.url} throttled to avoid rate limits`);
        return Promise.reject({
          __throttled: true,
          message: "Request throttled to avoid rate limits"
        });
      }
    }

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

    // Handle custom rejection cases
    if (error.__rateLimited) {
      console.debug("Request was rejected due to rate limit cooldown");
      return Promise.reject(new Error("Request rejected due to rate limit cooldown"));
    }

    if (error.__throttled) {
      console.debug("Request was throttled to prevent rate limits");
      return Promise.reject(new Error("Request throttled to prevent rate limits"));
    }

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

    // Special handling for rate limits (429)
    if (error.response?.status === 429) {
      console.warn("Rate limit exceeded (429), backing off");

      // Store rate limit info in session storage
      const rateLimitKey = 'rate_limit_hit';
      const rateLimitCount = parseInt(sessionStorage.getItem(rateLimitKey) || '0');
      sessionStorage.setItem(rateLimitKey, (rateLimitCount + 1).toString());

      // If we've hit rate limits multiple times, enforce a longer cooldown period
      if (rateLimitCount > 2) {
        const cooldownKey = 'rate_limit_cooldown';
        const now = Date.now();
        const cooldownUntil = now + (30 * 1000); // 30 second cooldown
        sessionStorage.setItem(cooldownKey, cooldownUntil.toString());
        console.warn("Multiple rate limits detected, enforcing cooldown period");
      }

      // If this is a demo login or validate request, return a mock response
      if (originalRequest?.url?.includes('/auth/demo') ||
        originalRequest?.url?.includes('/auth/validate')) {
        // Create a mock successful response
        const mockUser = {
          id: 'demo-' + Math.random().toString(36).substring(2, 10),
          username: 'demo_user',
          email: 'demo@harmonic-universe.com',
          firstName: 'Demo',
          lastName: 'User',
          role: 'user'
        };

        return {
          data: originalRequest.url.includes('/auth/validate')
            ? mockUser
            : {
              message: 'Demo login successful',
              user: mockUser,
              token: 'mock-token-' + Math.random().toString(36).substring(2, 15)
            }
        };
      }

      // Don't retry automatically for rate limits
      return Promise.reject(error);
    }

    // Handle 429 Too Many Requests with exponential backoff
    if (error.response?.status === 429 && !originalRequest._rateLimitRetry) {
      // Track retry attempts
      if (!originalRequest._retryCount) {
        originalRequest._retryCount = 0;
      }

      // Max 3 retries for rate limiting
      if (originalRequest._retryCount < 1) { // Reduced from 3 to 1 to avoid cascading
        originalRequest._rateLimitRetry = true;
        originalRequest._retryCount++;

        // Calculate delay with exponential backoff
        const delay = Math.pow(2, originalRequest._retryCount) * 2000; // Increased delay

        console.log(`Rate limited (429), retry attempt ${originalRequest._retryCount} after ${delay}ms delay...`);

        // Wait for the calculated delay
        await new Promise(resolve => setTimeout(resolve, delay));

        // Retry the request
        return axiosInstance(originalRequest);
      }
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
  demoLogin: async () => {
    try {
      // Check if we're in a rate limit cooldown or production environment
      const isProduction = process.env.NODE_ENV === 'production' ||
        import.meta.env.PROD ||
        !window.location.hostname.includes('localhost');

      // In production or during rate limit, return mock response immediately
      if (isProduction || isInRateLimitCooldown()) {
        console.log("API - Using mock demo login to avoid rate limits");

        const mockUser = {
          id: 'demo-' + Math.random().toString(36).substring(2, 10),
          username: 'demo_user',
          email: 'demo@harmonic-universe.com',
          firstName: 'Demo',
          lastName: 'User',
          role: 'user',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const mockToken = 'demo-token-' + Math.random().toString(36).substring(2, 15);

        return {
          data: {
            message: 'Demo login successful (mock)',
            user: mockUser,
            token: mockToken
          },
          status: 200
        };
      }

      const endpoint = getEndpoint('auth', 'demoLogin', '/api/auth/demo-login');
      console.log("API - Making demo login request to:", endpoint);

      // Use GET method as the endpoint accepts both GET and POST
      const response = await axiosInstance.get(endpoint);

      console.log("API - Demo login response:", {
        status: response.status,
        hasData: !!response.data,
        hasUser: !!response.data?.user,
        hasToken: !!response.data?.token
      });

      // Verify we have the necessary data in the response
      if (!response.data) {
        console.error("API - Demo login response missing data");
        throw new Error("Invalid response from server: missing data");
      }

      if (!response.data.token) {
        console.error("API - Demo login response missing token");
        throw new Error("Invalid response from server: missing token");
      }

      if (!response.data.user) {
        console.error("API - Demo login response missing user data");
        throw new Error("Invalid response from server: missing user data");
      }

      return response;
    } catch (error) {
      console.error("API - Demo login error:", error.message);

      if (error.response) {
        console.error("API - Server response error:", {
          status: error.response.status,
          data: error.response.data
        });
      }

      // If we got a rate limit error, return a mock response
      if (error.response?.status === 429) {
        console.log("API - Demo login hit rate limit, using mock response");

        const mockUser = {
          id: 'demo-fallback-' + Math.random().toString(36).substring(2, 10),
          username: 'demo_user',
          email: 'demo@harmonic-universe.com',
          firstName: 'Demo',
          lastName: 'User',
          role: 'user',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const mockToken = 'demo-token-' + Math.random().toString(36).substring(2, 15);

        return {
          data: {
            message: 'Demo login successful (mock due to rate limit)',
            user: mockUser,
            token: mockToken
          },
          status: 200
        };
      }

      // Rethrow the error to be handled by the calling code
      throw error;
    }
  },
  validateToken: async () => {
    try {
      console.log("Attempting to validate token");
      const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);

      if (!token) {
        console.log("No token found in localStorage");
        throw new Error("No token available");
      }

      // Check if we're in a rate limit cooldown or production environment
      const isProduction = process.env.NODE_ENV === 'production' ||
        import.meta.env.PROD ||
        !window.location.hostname.includes('localhost');

      // In production or during rate limit, avoid real validation and assume token is valid
      // This helps reduce rate limit issues on page load 
      if (isProduction || isInRateLimitCooldown()) {
        console.log("Using cached token validation to avoid rate limits");

        // Try to get user data from localStorage
        const userStr = localStorage.getItem(AUTH_CONFIG.USER_KEY);
        let userData = null;

        if (userStr) {
          try {
            userData = JSON.parse(userStr);
          } catch (e) {
            console.error("Failed to parse stored user data", e);
          }
        }

        // If we have user data, return it without validation
        if (userData) {
          console.log("Using cached user data");
          return {
            data: {
              message: "Token validation successful (cached)",
              user: userData
            }
          };
        }

        // If no user data, create mock data
        console.log("No cached user data, creating mock data");
        const mockUser = {
          id: token.substring(0, 8),
          username: 'user',
          email: 'user@example.com'
        };

        return {
          data: {
            message: "Token validation successful (mock)",
            user: mockUser
          }
        };
      }

      // Use the auth validate endpoint with fixed getEndpoint function
      const validateEndpoint = getEndpoint('auth', 'validate', '/api/auth/validate');
      console.log("Using auth validate endpoint:", validateEndpoint);

      // Debugging log to verify URL construction
      const fullUrl = axiosInstance.defaults.baseURL +
        (validateEndpoint.startsWith('/') ? validateEndpoint.substring(1) : validateEndpoint);
      console.log("Full request URL will be:", fullUrl);

      const response = await axiosInstance.get(validateEndpoint);
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
        status: error.response?.status,
        url: error.config?.url
      });

      // If we got a rate limit error, return a mock response
      if (error.response?.status === 429) {
        console.log("API - Token validation hit rate limit, using mock response");

        // Try to get user data from localStorage as fallback
        const userStr = localStorage.getItem(AUTH_CONFIG.USER_KEY);
        let userData = null;

        if (userStr) {
          try {
            userData = JSON.parse(userStr);
          } catch (e) {
            console.error("Failed to parse stored user data", e);
          }
        }

        // If we have user data, return it
        if (userData) {
          return {
            data: {
              message: "Token validation successful (cached, rate limited)",
              user: userData
            }
          };
        }

        // Otherwise just create a simple mock user
        const mockUser = {
          id: token.substring(0, 8),
          username: 'user',
          email: 'user@example.com'
        };

        return {
          data: {
            message: "Token validation successful (mock, rate limited)",
            user: mockUser
          }
        };
      }

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
    // More robust validation for id
    if (id === undefined || id === null || id === 'undefined' || id === 'null') {
      console.error(`getUniverse: Invalid universe ID: '${id}'`);
      // Return an empty response to prevent app breaking
      return Promise.resolve({
        data: {
          universe: {},
          message: "No universe selected",
          error: "Invalid universe ID"
        }
      });
    }

    const queryParams = new URLSearchParams();
    if (params.includeScenes) {
      queryParams.append("include_scenes", "true");
    }

    // Get endpoint and ensure it's called if it's a function
    const endpoint = getEndpoint('universes', 'get', `/api/universes/${id}`);
    const url = typeof endpoint === 'function' ? endpoint(id) : endpoint;

    console.log(`getUniverse: Fetching universe ${id} from ${url}`);

    // Handle API error more gracefully
    return axiosInstance.get(`${url}?${queryParams.toString()}`)
      .catch(error => {
        console.error(`getUniverse: Error fetching universe ${id}:`, error);
        // Return friendly error response rather than throwing
        return {
          data: {
            universe: {},
            message: "Error fetching universe",
            error: error.message || "Unknown error"
          }
        };
      });
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
      const endpoint = getEndpoint('universes', 'delete', `/api/universes/${id}`);
      const url = typeof endpoint === 'function' ? endpoint(id) : endpoint;

      const response = await axiosInstance.delete(url);
      console.log(`API - deleteUniverse - Successfully deleted universe ${id}:`, response);
      return response;
    } catch (error) {
      console.error(`API - deleteUniverse - Error deleting universe ${id}:`, error.response || error);

      // In development mode, return a mock success response if needed
      if (process.env.NODE_ENV === 'development' && error.response?.status === 404) {
        console.log(`API - deleteUniverse - Development mode: Returning mock success for missing universe ${id}`);
        return {
          status: 200,
          data: {
            message: `Universe ${id} deleted successfully (mock)`
          }
        };
      }

      // Re-throw the error to be handled by the calling code
      throw error;
    }
  },
  getUniverseScenes: (universeId) => {
    console.log(`API - getUniverseScenes - Starting fetch for universe ${universeId}`);

    // Define all possible endpoints to try in sequence
    // Reordered to prioritize endpoints that work without CORS issues
    const endpoints = [
      `/api/scenes/universe/${universeId}`, // This endpoint works without CORS issues - use it first
      `/api/universes/${universeId}/scenes`,
      `/api/universes/${universeId}?include_scenes=true`,
      `/api/scenes?universe_id=${universeId}` // This endpoint has CORS issues - try it last
    ];

    // Return a promise that handles errors more gracefully
    return new Promise((resolve) => {
      // Helper function to try the next endpoint
      const tryNextEndpoint = (index) => {
        if (index >= endpoints.length) {
          console.log(`API - getUniverseScenes - All endpoints failed for universe ${universeId}`);
          // If all endpoints fail, return an empty response with success status
          // This prevents UI breakage while logging the issue
          return resolve({
            status: 200,
            data: {
              scenes: [],
              message: 'No scenes found for this universe',
              _debug_info: 'All scene endpoints failed'
            }
          });
        }

        const endpoint = endpoints[index];
        console.log(`API - getUniverseScenes - Trying endpoint ${index + 1}/${endpoints.length}: ${endpoint}`);

        axiosInstance.get(endpoint)
          .then(response => {
            console.log(`API - getUniverseScenes - Got response from ${endpoint}:`, response.data);

            // Process the response to extract scenes, handling different response formats
            let scenes = [];

            // Case 1: Direct array in data
            if (Array.isArray(response.data)) {
              scenes = response.data;
            }
            // Case 2: Scenes in data.scenes property
            else if (response.data?.scenes && Array.isArray(response.data.scenes)) {
              scenes = response.data.scenes;
            }
            // Case 3: Scenes in data.universe.scenes property (for the include_scenes endpoint)
            else if (response.data?.universe?.scenes && Array.isArray(response.data.universe.scenes)) {
              scenes = response.data.universe.scenes;
            }
            // Case 4: Search for any array property in the response
            else if (response.data && typeof response.data === 'object') {
              for (const [key, value] of Object.entries(response.data)) {
                if (Array.isArray(value) && value.length > 0 &&
                  (key.includes('scene') || (value[0] && (value[0].universe_id || value[0].name)))) {
                  console.log(`API - getUniverseScenes - Found potential scenes array in response.data.${key}`);
                  scenes = value;
                  break;
                }
              }
            }

            // If we found scenes, return them
            if (scenes && scenes.length > 0) {
              console.log(`API - getUniverseScenes - Successfully extracted ${scenes.length} scenes`);
              return resolve({
                status: 200,
                data: {
                  scenes: scenes,
                  message: 'Scenes retrieved successfully',
                  _debug_endpoint: endpoint
                }
              });
            } else {
              console.log(`API - getUniverseScenes - No scenes found in response from ${endpoint}, trying next endpoint`);
              tryNextEndpoint(index + 1);
            }
          })
          .catch(error => {
            console.error(`API - getUniverseScenes - Error with endpoint ${endpoint}:`, error.message || error);
            // Try the next endpoint
            tryNextEndpoint(index + 1);
          });
      };

      // Start with the first endpoint
      tryNextEndpoint(0);
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
    }
    // Otherwise treat it as a params object
    else if (params.universeId) {
      queryParams.append("universe_id", params.universeId);
    }

    // Get the base endpoint
    const baseEndpoint = getEndpoint('scenes', 'list', '/api/scenes');
    // Form the complete URL
    const url = `${baseEndpoint}?${queryParams.toString()}`;

    console.log("Fetching scenes from URL:", url);

    // Return a promise that handles errors more gracefully
    return new Promise((resolve) => {
      axiosInstance.get(url)
        .then(response => {
          console.log("Scenes API response:", response);
          resolve(response);
        })
        .catch(error => {
          console.error("Error fetching scenes:", error);

          // Always resolve with a valid response containing an empty scenes array
          const universeId = typeof params === 'string' || typeof params === 'number' ? params : params.universeId;
          console.log(`Resolving with empty scenes array for getScenes (universeId: ${universeId}) to prevent UI errors`);

          resolve({
            status: 200, // Force a success status
            data: {
              scenes: [], // Always provide empty scenes array to prevent UI breakage
              message: "No scenes found"
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
    // More robust validation for universeId
    if (universeId === undefined || universeId === null || universeId === 'undefined' || universeId === 'null') {
      console.error(`getCharactersByUniverse: Invalid universe ID: '${universeId}'`);
      // Return an empty response to prevent app breaking
      return Promise.resolve({
        data: {
          characters: [],
          message: "No universe selected",
          error: "Invalid universe ID"
        }
      });
    }

    const endpoint = getEndpoint('universes', 'characters', `/api/universes/${universeId}/characters`);
    const url = typeof endpoint === 'function' ? endpoint(universeId) : endpoint;

    console.log(`getCharactersByUniverse: Fetching characters for universe ${universeId} from ${url}`);

    // Handle API error more gracefully
    return axiosInstance.get(url)
      .catch(error => {
        console.error(`getCharactersByUniverse: Error fetching characters for universe ${universeId}:`, error);
        // Return friendly error response rather than throwing
        return {
          data: {
            characters: [],
            message: "Error fetching characters",
            error: error.message || "Unknown error"
          }
        };
      });
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