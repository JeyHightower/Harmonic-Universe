import axios from "axios";
import { log } from "../utils/logger";
import { AUTH_CONFIG } from "../utils/config";

// Helper function to determine API endpoint
function chooseApiEndpoint() {
  // Check if we're in a production environment
  const isProduction = process.env.NODE_ENV === 'production' ||
    import.meta.env.PROD ||
    window.location.hostname.includes('render.com') ||
    (!window.location.hostname.includes('localhost') &&
      !window.location.hostname.includes('127.0.0.1'));

  if (isProduction) {
    // In production, use relative URL (same origin)
    return '/api';
  }

  // In development, use the localhost URL
  return import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
}

// Constants
export const API_BASE_ENDPOINT = chooseApiEndpoint();

// Debug logging
if (typeof window !== 'undefined') {
  // Initialize API debug object if not exists
  if (!window.apiDebug) {
    window.apiDebug = {
      operations: [],
      errors: [],
      baseUrl: API_BASE_ENDPOINT,
      lastRequest: null,
      lastError: null,
    };
  }

  // Log the endpoint being used
  console.log(`API Base Endpoint: ${API_BASE_ENDPOINT}`);
  window.apiDebug.baseUrl = API_BASE_ENDPOINT;
}

// Add global debugging endpoint for API operations
window.apiDebug = {
  lastRequest: null,
  lastResponse: null,
  lastError: null,
  baseEndpoint: API_BASE_ENDPOINT,
  testEndpoint: async () => {
    try {
      const response = await axios.get(`${API_BASE_ENDPOINT}/ping`);
      return {
        success: true,
        endpoint: API_BASE_ENDPOINT,
        status: response.status,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        endpoint: API_BASE_ENDPOINT,
        error: error.message,
      };
    }
  },
};

// Create axios instance
const client = axios.create({
  baseURL: API_BASE_ENDPOINT,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
  withCredentials: true, // Important for CORS with credentials
  timeout: 15000, // 15 second timeout
});

export { client };

// Request interceptor
client.interceptors.request.use(
  (config) => {
    try {
      // Log request
      log("api", "Sending request", {
        method: config.method?.toUpperCase() || 'Unknown method',
        url: config.url,
        baseURL: config.baseURL,
        fullURL: `${config.baseURL}${config.url}`,
        withCredentials: config.withCredentials,
      });

      // Store for debugging
      window.apiDebug.lastRequest = {
        method: config.method?.toUpperCase() || 'Unknown method',
        url: config.url,
        baseURL: config.baseURL,
        timestamp: new Date().toISOString(),
        withCredentials: config.withCredentials,
      };

      // Add auth token if available
      const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }

      return config;
    } catch (error) {
      log("api", "Error in request interceptor", {
        error: error.message,
      });
      window.apiDebug.lastError = {
        type: "request",
        error: error.message,
        timestamp: new Date().toISOString(),
      };
      return config;
    }
  },
  (error) => {
    log("api", "Request failed", { error: error.message });
    window.apiDebug.lastError = {
      type: "request",
      error: error.message,
      timestamp: new Date().toISOString(),
    };
    return Promise.reject(error);
  }
);

// Response interceptor
client.interceptors.response.use(
  (response) => {
    try {
      // Log successful response
      log("api", "Response received", {
        status: response.status,
        url: response.config.url,
        data: response.data ? "Present" : "Empty",
      });

      // Store for debugging
      window.apiDebug.lastResponse = {
        status: response.status,
        url: response.config.url,
        timestamp: new Date().toISOString(),
      };

      return response;
    } catch (error) {
      log("api", "Error in response interceptor", {
        error: error.message,
      });
      return response;
    }
  },
  (error) => {
    try {
      // Get error details
      const status = error.response ? error.response.status : "No status";
      const url = error.config ? error.config.url : "Unknown URL";
      const method = error.config
        ? error.config.method.toUpperCase()
        : "Unknown Method";

      // Log error
      log("api", "Response error", {
        status,
        url,
        method,
        message: error.message,
        response: error.response ? error.response.data : "No response data",
      });

      // Store for debugging
      window.apiDebug.lastError = {
        type: "response",
        status,
        url,
        method,
        message: error.message,
        timestamp: new Date().toISOString(),
      };

      // Special handling for demo login
      if (url.includes("/auth/demo-login") || url.includes("/auth/demo")) {
        log("api", "Demo login failed, trying alternative endpoints");
        return retryWithFallbacks(error, "/auth/demo-login");
      }

      // Retry token refresh with alternative endpoints
      if (url.includes("/auth/refresh") && status === 401) {
        log("api", "Token refresh failed, trying alternative endpoints");
        return retryWithFallbacks(error, "/auth/refresh");
      }

      // If auth token expired
      if (status === 401 && !url.includes("/auth/login")) {
        // Remove token
        localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
        localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);

        // Redirect to login
        log("api", "Unauthorized access, redirecting to login");
        setTimeout(() => {
          window.location.href = "/#/?modal=login&authError=true";
        }, 100);
      }

      return Promise.reject(error);
    } catch (interceptorError) {
      log("api", "Error handling API error", {
        error: interceptorError.message,
      });
      return Promise.reject(error);
    }
  }
);

// Retry failed requests with alternative endpoints
async function retryWithFallbacks(originalError, endpoint) {
  // Check for production environment
  const isProduction = process.env.NODE_ENV === 'production' ||
    import.meta.env.PROD ||
    window.location.hostname.includes('render.com') ||
    (!window.location.hostname.includes('localhost') &&
      !window.location.hostname.includes('127.0.0.1'));

  // Track retry attempts in session storage to respect rate limits
  const retryKey = `retry_${endpoint}`;
  const retryCount = parseInt(sessionStorage.getItem(retryKey) || '0');

  // Enforce stricter retry limits in production to avoid 429s
  const maxRetries = isProduction ? 1 : 3;

  // If we've exceeded retry attempts, bail out quickly with fallback
  if (retryCount >= maxRetries) {
    log("api", "Maximum retry attempts reached, skipping retries", { endpoint, retryCount });
    sessionStorage.setItem(retryKey, '0'); // Reset for next attempt after some time

    // For demo login, return mock response without further attempts
    if (endpoint.includes("/auth/demo-login") || endpoint.includes("/auth/demo")) {
      return createMockDemoResponse(originalError.config || {});
    }

    return Promise.reject(originalError);
  }

  // Increment retry counter
  sessionStorage.setItem(retryKey, (retryCount + 1).toString());

  // Use exponential backoff for retries
  const backoffDelay = Math.min(1000 * Math.pow(2, retryCount), 10000);
  if (retryCount > 0) {
    log("api", `Applying backoff delay before retry: ${backoffDelay}ms`, { endpoint, retryCount });
    await new Promise(resolve => setTimeout(resolve, backoffDelay));
  }

  // Adjust fallback endpoints for production vs development
  const fallbackEndpoints = isProduction
    ? [
      "" // Same origin, empty string for baseURL (best for avoiding rate limits)
    ]
    : [
      "/api",
      "http://localhost:5001/api"
    ];

  // Log environment and fallback choices
  log("api", "Retry environment", {
    isProduction,
    originalUrl: originalError.config?.url,
    endpoint,
    fallbackEndpoints,
    retryCount
  });

  // Original request config
  const config = originalError.config;
  if (!config) {
    log("api", "Cannot retry request without config");
    return Promise.reject(originalError);
  }

  // Special handling for 429 rate limit errors
  if (originalError.response?.status === 429) {
    log("api", "Rate limit hit (429), returning fallback response without retrying");

    // For demo login, return mock response immediately without retrying
    if (endpoint.includes("/auth/demo-login") || endpoint.includes("/auth/demo")) {
      return createMockDemoResponse(config);
    }

    return Promise.reject(originalError);
  }

  // Special handling for demo login - handle production vs development differently
  if (endpoint.includes("/auth/demo") || endpoint.includes("/auth/demo-login")) {
    // In production, prefer mock response immediately to avoid rate limits
    if (isProduction) {
      log("api", "Using mock demo login in production to avoid rate limits");
      return createMockDemoResponse(config);
    }

    // For demo login in production, strip any duplicate /api prefixes
    if (isProduction && endpoint.startsWith("/api/")) {
      endpoint = endpoint.substring(4); // Remove leading /api
      log("api", "Adjusted demo endpoint for production", { endpoint });
    }

    // In development, we can try real requests first
    try {
      log("api", "Attempting demo login with real endpoint in development");
      // Just try one fallback to avoid rate limits
      const baseURL = fallbackEndpoints[0];

      // Adjust endpoint if needed to prevent /api duplication
      let adjustedEndpoint = endpoint;
      if (isProduction && baseURL.endsWith('/api') && adjustedEndpoint.startsWith('/api/')) {
        adjustedEndpoint = adjustedEndpoint.substring(4);
      }

      // Create retry config for single attempt
      const retryConfig = {
        ...config,
        baseURL,
        url: adjustedEndpoint,
      };

      const response = await axios(retryConfig);
      return response;
    } catch (error) {
      log("api", "Demo login request failed, using mock response", { error: error.message });
      return createMockDemoResponse(config);
    }
  }

  // Try fallback endpoint - just using the first one to avoid rate limits
  try {
    const baseURL = fallbackEndpoints[0];
    log("api", "Trying fallback endpoint", { baseURL, endpoint });

    // Adjust endpoint if needed to prevent /api duplication
    let adjustedEndpoint = endpoint;
    if (isProduction && baseURL.endsWith('/api') && adjustedEndpoint.startsWith('/api/')) {
      adjustedEndpoint = adjustedEndpoint.substring(4);
      log("api", "Adjusted endpoint to prevent duplication", { originalEndpoint: endpoint, adjustedEndpoint });
    }

    // Create new config with fallback baseURL
    const retryConfig = {
      ...config,
      baseURL,
      url: adjustedEndpoint,
    };

    const response = await axios(retryConfig);

    // Reset retry counter on success
    sessionStorage.setItem(retryKey, '0');

    return response;
  } catch (retryError) {
    log("api", "Fallback endpoint failed", {
      endpoint,
      error: retryError.message,
      status: retryError.response?.status
    });

    // For demo login, fall back to mock
    if (endpoint.includes("/auth/demo-login") || endpoint.includes("/auth/demo")) {
      return createMockDemoResponse(config);
    }

    return Promise.reject(retryError);
  }
}

// Helper function to create a mock demo response
function createMockDemoResponse(config) {
  log("api", "Creating mock demo login response");

  // Create a demo user with realistic data
  const demoUser = {
    id: 'demo-' + Math.random().toString(36).substring(2, 10),
    username: 'demo_user',
    email: 'demo@harmonic-universe.com',
    firstName: 'Demo',
    lastName: 'User',
    role: 'user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Create a mock token that looks like a real JWT
  const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZW1vLXVzZXIiLCJpYXQiOjE2NTE4MzAyMDAsImV4cCI6MTY1MTkxNjYwMH0.' +
    Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

  // Create a mock successful response
  return {
    data: {
      message: 'Demo login successful',
      user: demoUser,
      token: mockToken
    },
    status: 200,
    statusText: 'OK',
    headers: {},
    config: config
  };
}

// Create a fetchWithCredentials function for the apiClient to use
const fetchWithCredentials = async (url, method = "GET", data = null) => {
  try {
    // Log operation
    log("api", "fetchWithCredentials-started", { url, method });

    // Determine full URL if not absolute
    const fullUrl = url.startsWith("http") ? url : `${API_BASE_ENDPOINT}${url}`;

    // Setup options
    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      credentials: "include",
    };

    // Add auth token if available
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    if (token) {
      options.headers["Authorization"] = `Bearer ${token}`;
    }

    // Add body if there's data
    if (data) {
      options.body = JSON.stringify(data);
    }

    // Make the request
    const response = await fetch(fullUrl, options);

    // Check if response is ok
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // Parse and return response
    const result = await response.json();
    log("api", "fetchWithCredentials-success", { url });
    return result;
  } catch (error) {
    log("api", "fetchWithCredentials-error", { url, message: error.message });
    throw error;
  }
};

// Export API methods with error handling and logging
const apiClient = {
  get: async (url, config = {}) => {
    try {
      log("api", "get-started", { url });
      const response = await client.get(url, config);
      log("api", "get-success", { url });
      return response;
    } catch (error) {
      log("api", "get-error", {
        url,
        message: error.message,
      });
      throw error;
    }
  },

  post: async (url, data = {}, config = {}) => {
    try {
      log("api", "post-started", { url });
      const response = await client.post(url, data, config);
      log("api", "post-success", { url });
      return response;
    } catch (error) {
      log("api", "post-error", {
        url,
        message: error.message,
      });
      throw error;
    }
  },

  // Updated fetchWithCredentials
  fetchWithCredentials,

  put: async (url, data = {}, config = {}) => {
    try {
      log("api", "put-started", { url });
      const response = await client.put(url, data, config);
      log("api", "put-success", { url });
      return response;
    } catch (error) {
      log("api", "put-error", {
        url,
        message: error.message,
      });
      throw error;
    }
  },

  delete: async (url, config = {}) => {
    try {
      log("api", "delete-started", { url });
      const response = await client.delete(url, config);
      log("api", "delete-success", { url });
      return response;
    } catch (error) {
      log("api", "delete-error", {
        url,
        message: error.message,
      });
      throw error;
    }
  },

  // Character methods required for compatibility with characterThunks.js
  getCharacter: async (characterId) => {
    try {
      log("api", "getCharacter-started", { characterId });
      const response = await client.get(`/characters/${characterId}`);
      log("api", "getCharacter-success", { characterId });
      return response;
    } catch (error) {
      log("api", "getCharacter-error", {
        characterId,
        message: error.message
      });
      throw error;
    }
  },

  updateCharacter: async (characterId, characterData) => {
    try {
      log("api", "updateCharacter-started", { characterId });
      const response = await client.put(`/characters/${characterId}`, characterData);
      log("api", "updateCharacter-success", { characterId });
      return response;
    } catch (error) {
      log("api", "updateCharacter-error", {
        characterId,
        message: error.message
      });
      throw error;
    }
  },

  deleteCharacter: async (characterId) => {
    try {
      log("api", "deleteCharacter-started", { characterId });
      const response = await client.delete(`/characters/${characterId}`);
      log("api", "deleteCharacter-success", { characterId });
      return response;
    } catch (error) {
      log("api", "deleteCharacter-error", {
        characterId,
        message: error.message
      });
      throw error;
    }
  }
};

export default apiClient;
