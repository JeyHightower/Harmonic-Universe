import axios from "axios";
import { generalLogger } from "./logger";

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
    local: "http://localhost:5000/api",

    // Production endpoints
    production: "https://harmonic-universe-api.onrender.com/api",
    prodCDN: "https://harmonic-universe.onrender.com/api",

    // Fallback endpoint (same origin)
    fallback: "/api",
  };

  // Check environment
  const isDev = process.env.NODE_ENV === "development";

  // Log the selection process
  window.debugLog("API", "Selecting API endpoint", {
    environment: process.env.NODE_ENV,
    isDev,
  });

  // Allow override with .env variables
  const envEndpoint = import.meta.env.VITE_API_ENDPOINT;
  if (envEndpoint) {
    window.debugLog("API", "Using API endpoint from environment variable", {
      endpoint: envEndpoint,
    });
    generalLogger.log("Using API endpoint from environment variable", {
      endpoint: envEndpoint,
    });
    return envEndpoint;
  }

  // For development, use local endpoint
  if (isDev) {
    window.debugLog("API", "Using local development endpoint", {
      endpoint: endpoints.local,
    });
    generalLogger.log("Using local development endpoint");
    return endpoints.local;
  }

  // For production, try to infer the best endpoint
  // If we're on the same domain as our API, use relative path
  const currentHost = window.location.hostname;
  if (currentHost.includes("harmonic-universe")) {
    window.debugLog("API", "Using relative API endpoint", {
      endpoint: endpoints.fallback,
      currentHost,
    });
    generalLogger.log("Using relative API endpoint", { host: currentHost });
    return endpoints.fallback;
  }

  // Default to using the production endpoint
  window.debugLog("API", "Using production API endpoint", {
    endpoint: endpoints.production,
  });
  generalLogger.log("Using production API endpoint");
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
      window.debugLog("API", "Sending request", {
        method: config.method.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
        fullURL: `${config.baseURL}${config.url}`,
      });
      generalLogger.log("API Request", {
        method: config.method.toUpperCase(),
        url: config.url,
      });

      // Store for debugging
      window.apiDebug.lastRequest = {
        method: config.method.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
        timestamp: new Date().toISOString(),
      };

      // Add auth token if available
      const token = localStorage.getItem("token");
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }

      return config;
    } catch (error) {
      window.debugError("API", "Error in request interceptor", error);
      generalLogger.error("Error in API request interceptor", {
        error: error.message,
      });
      return config;
    }
  },
  (error) => {
    window.debugError("API", "Request failed", error);
    generalLogger.error("API request failed", { error: error.message });
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
      window.debugLog("API", "Response received", {
        status: response.status,
        url: response.config.url,
        data: response.data ? "Present" : "Empty",
      });
      generalLogger.log("API Response", {
        status: response.status,
        url: response.config.url,
      });

      // Store for debugging
      window.apiDebug.lastResponse = {
        status: response.status,
        url: response.config.url,
        timestamp: new Date().toISOString(),
      };

      return response;
    } catch (error) {
      window.debugError("API", "Error in response interceptor", error);
      generalLogger.error("Error in API response interceptor", {
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
      window.debugError("API", "Response error", {
        status,
        url,
        method,
        message: error.message,
        response: error.response ? error.response.data : "No response data",
      });
      generalLogger.error("API Response error", {
        status,
        url,
        method,
        message: error.message,
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
        window.debugLog(
          "API",
          "Demo login failed, trying alternative endpoints"
        );
        return retryWithFallbacks(error, "/auth/demo");
      }

      // Retry token refresh with alternative endpoints
      if (url.includes("/auth/refresh") && status === 401) {
        window.debugLog(
          "API",
          "Token refresh failed, trying alternative endpoints"
        );
        return retryWithFallbacks(error, "/auth/refresh");
      }

      // If auth token expired
      if (status === 401 && !url.includes("/auth/login")) {
        // Remove token
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");

        // Redirect to login
        window.debugLog("API", "Unauthorized access, redirecting to login");
        setTimeout(() => {
          window.location.href = "/#/?modal=login&authError=true";
        }, 100);
      }

      return Promise.reject(error);
    } catch (interceptorError) {
      window.debugError("API", "Error handling API error", interceptorError);
      generalLogger.error("Error handling API error", {
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
    window.debugError("API", "Cannot retry request without config");
    return Promise.reject(originalError);
  }

  // Try each fallback endpoint
  for (const baseURL of fallbackEndpoints) {
    try {
      window.debugLog("API", "Trying fallback endpoint", { baseURL, endpoint });

      // Create new config with fallback baseURL
      const retryConfig = {
        ...config,
        baseURL,
        url: endpoint,
      };

      const response = await axios(retryConfig);

      // If successful, update the main API endpoint for future requests
      window.debugLog("API", "Fallback endpoint successful", {
        baseURL,
        status: response.status,
      });

      // Store the successful endpoint in sessionStorage for future use
      sessionStorage.setItem("lastSuccessfulEndpoint", baseURL);

      return response;
    } catch (retryError) {
      window.debugError("API", "Fallback endpoint failed", {
        baseURL,
        error: retryError.message,
      });
      continue;
    }
  }

  // If all fallbacks fail, reject with original error
  return Promise.reject(originalError);
}
