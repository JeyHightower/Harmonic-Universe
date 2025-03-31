import axios from "axios";
import { log } from "../utils/logger";
import { AUTH_CONFIG } from "../utils/config";

// Constants
export const API_BASE_ENDPOINT = chooseApiEndpoint();

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

// Choose the appropriate API endpoint based on environment
function chooseApiEndpoint() {
  const endpoints = {
    // Local development endpoint
    local: "http://localhost:5001/api",

    // Production endpoints
    production: "https://harmonic-universe-api.onrender.com/api",
    prodCDN: "https://harmonic-universe.onrender.com/api",

    // Fallback endpoint (same origin)
    fallback: "/api",
  };

  // Check environment
  const isDev = process.env.NODE_ENV === "development";

  // Log the selection process
  log("api", "Selecting API endpoint", {
    environment: process.env.NODE_ENV,
    isDev,
  });

  // Allow override with .env variables
  const envEndpoint = import.meta.env.VITE_API_ENDPOINT;
  if (envEndpoint) {
    log("api", "Using API endpoint from environment variable", {
      endpoint: envEndpoint,
    });
    return envEndpoint;
  }

  // For development, use local endpoint
  if (isDev) {
    log("api", "Using local development endpoint");
    return endpoints.local;
  }

  // For production, try to infer the best endpoint
  // If we're on the same domain as our API, use relative path
  const currentHost = window.location.hostname;
  if (currentHost.includes("harmonic-universe")) {
    log("api", "Using relative API endpoint", { host: currentHost });
    return endpoints.fallback;
  }

  // Default to using the production endpoint
  log("api", "Using production API endpoint");
  return endpoints.production;
}

// Create axios instance
const client = axios.create({
  baseURL: API_BASE_ENDPOINT,
  headers: {
    "Content-Type": "application/json",
  },
});

export { client };

// Request interceptor
client.interceptors.request.use(
  (config) => {
    try {
      // Log request
      log("api", "Sending request", {
        method: config.method.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
        fullURL: `${config.baseURL}${config.url}`,
      });

      // Store for debugging
      window.apiDebug.lastRequest = {
        method: config.method.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
        timestamp: new Date().toISOString(),
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
      if (url.includes("/auth/demo")) {
        log("api", "Demo login failed, trying alternative endpoints");
        return retryWithFallbacks(error, "/auth/demo");
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
  const fallbackEndpoints = [
    "/api",
    "https://harmonic-universe-api.onrender.com/api",
    "https://harmonic-universe.onrender.com/api",
  ];

  // Original request config
  const config = originalError.config;
  if (!config) {
    log("api", "Cannot retry request without config");
    return Promise.reject(originalError);
  }

  // Try each fallback endpoint
  for (const baseURL of fallbackEndpoints) {
    try {
      log("api", "Trying fallback endpoint", { baseURL, endpoint });

      // Create new config with fallback baseURL
      const retryConfig = {
        ...config,
        baseURL,
        url: endpoint,
      };

      const response = await axios(retryConfig);

      // If successful, update the main API endpoint for future requests
      log("api", "Fallback endpoint successful", {
        baseURL,
        status: response.status,
      });

      // Store the successful endpoint in sessionStorage for future use
      sessionStorage.setItem("lastSuccessfulEndpoint", baseURL);

      return response;
    } catch (retryError) {
      log("api", "Fallback endpoint failed", {
        baseURL,
        error: retryError.message,
      });
      continue;
    }
  }

  // If all fallbacks fail, reject with original error
  return Promise.reject(originalError);
}
