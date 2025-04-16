import axios from "axios";
import { apiLogger } from "./utils/logger";
import { AUTH_CONFIG } from "./utils/config";

// Debug helper for API operations
const logApiOperation = (operation, data = {}) => {
  apiLogger.log(operation, data);

  // Initialize debug object if not exists
  if (!window.apiDebug) {
    window.apiDebug = {
      operations: [],
      errors: [],
      baseUrl: null,
    };
  }

  // Add operation to log
  window.apiDebug.operations.push({
    time: new Date().toISOString(),
    operation,
    ...data,
  });
};

// Determine the base URL based on environment with enhanced detection
const getBaseUrl = () => {
  logApiOperation("getBaseUrl-started");

  try {
    // Try environment variable first
    const envUrl = import.meta.env.VITE_API_URL;
    if (envUrl) {
      logApiOperation("getBaseUrl-env", { url: envUrl });
      return envUrl;
    }

    // Get information about current environment
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const port = window.location.port;
    const origin = window.location.origin;

    logApiOperation("getBaseUrl-environment", {
      hostname,
      protocol,
      port,
      origin,
    });

    // Handle production environments (including Render.com)
    if (!hostname.includes("localhost") && !hostname.includes("127.0.0.1")) {
      // For production, use relative API URLs (same domain)
      logApiOperation("getBaseUrl-production", { url: "" });
      window.apiDebug.baseUrl = "";
      return "";
    }

    // Default for local development: use localhost:5001
    const localUrl = "http://localhost:5001";
    logApiOperation("getBaseUrl-local", { url: localUrl });
    window.apiDebug.baseUrl = localUrl;
    return localUrl;
  } catch (error) {
    console.error("Error in getBaseUrl:", error);
    logApiOperation("getBaseUrl-error", {
      message: error.message,
      stack: error.stack,
    });

    // Add to errors collection
    if (window.apiDebug) {
      window.apiDebug.errors.push({
        time: new Date().toISOString(),
        operation: "getBaseUrl",
        error: error.message,
        stack: error.stack,
      });
    }

    // Return empty string as fallback (same origin)
    return "";
  }
};

// Get and log the base URL early
const apiBaseUrl = getBaseUrl();
apiLogger.info("API base URL determined", { baseURL: apiBaseUrl });

// Create axios instance with improved configuration
const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    Origin: window.location.origin,
  },
  withCredentials: true,
  timeout: 15000, // 15 second timeout
});

apiLogger.log("API client initialized", {
  baseURL: apiBaseUrl,
  withCredentials: true,
  origin: window.location.origin,
});

// Request interceptor with enhanced logging
api.interceptors.request.use(
  (config) => {
    // Log the request
    logApiOperation("request", {
      method: config.method,
      url: config.url,
      baseUrl: config.baseURL,
      fullUrl: config.baseURL + config.url,
      headers: config.headers,
    });

    // Get token from localStorage using standardized key
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);

    // If token exists, add to headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      apiLogger.log("Added token to request");
    }

    return config;
  },
  (error) => {
    apiLogger.error("Request error", error);
    return Promise.reject(error);
  }
);

// Response interceptor with enhanced error handling
api.interceptors.response.use(
  (response) => {
    logApiOperation("response-success", {
      status: response.status,
      url: response.config.url,
      data:
        typeof response.data === "object"
          ? Object.keys(response.data)
          : typeof response.data,
    });
    return response;
  },
  async (error) => {
    logApiOperation("response-error", {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data,
    });

    // Add to errors collection
    if (window.apiDebug) {
      window.apiDebug.errors.push({
        time: new Date().toISOString(),
        url: error.config?.url,
        status: error.response?.status,
        message: error.message,
      });
    }

    const originalRequest = error.config;

    // Handle 429 Too Many Requests with exponential backoff
    if (error.response?.status === 429 && originalRequest) {
      // Initialize retry count if it doesn't exist
      if (!originalRequest._retryCount) {
        originalRequest._retryCount = 0;
      }

      // Limit to 3 retries
      if (originalRequest._retryCount < 3) {
        originalRequest._retryCount++;

        // Calculate exponential backoff delay: 2^retry * 1000 ms
        const delay = Math.pow(2, originalRequest._retryCount) * 1000;

        logApiOperation("rate-limit-retry", {
          attempt: originalRequest._retryCount,
          delay,
          url: originalRequest.url,
        });

        // Log to console for visibility
        console.log(`Rate limited (429), retrying in ${delay}ms... (attempt ${originalRequest._retryCount}/3)`);

        // Wait for the calculated delay
        await new Promise(resolve => setTimeout(resolve, delay));

        // Retry the request
        return api(originalRequest);
      } else {
        logApiOperation("rate-limit-max-retries-reached", {
          url: originalRequest.url,
        });
        console.warn("Maximum rate limit retries reached, giving up.");
      }
    }

    // Try token refresh for 401 errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      logApiOperation("token-refresh-attempt");

      try {
        // Try to refresh token
        const refreshToken = localStorage.getItem("refreshToken");

        if (refreshToken) {
          logApiOperation("token-refresh-request");

          try {
            // Try multiple refresh endpoints
            let response = null;
            const refreshEndpoints = [
              "/api/auth/refresh/",
              "/api/v1/auth/refresh/",
              `${apiBaseUrl}/api/auth/refresh/`,
              `${apiBaseUrl}/api/v1/auth/refresh/`,
            ];

            for (const endpoint of refreshEndpoints) {
              try {
                logApiOperation("token-refresh-endpoint", { endpoint });
                response = await axios.post(endpoint, {
                  refresh_token: refreshToken,
                });

                if (response.status === 200) {
                  logApiOperation("token-refresh-success", { endpoint });
                  break;
                }
              } catch (endpointError) {
                logApiOperation("token-refresh-endpoint-error", {
                  endpoint,
                  error: endpointError.message,
                });
              }
            }

            if (!response || response.status !== 200) {
              throw new Error("All refresh token endpoints failed");
            }

            if (response.data.access_token) {
              // Update token in localStorage
              localStorage.setItem("accessToken", response.data.access_token);
              logApiOperation("access-token-updated");

              // Update token in headers
              api.defaults.headers.common.Authorization = `Bearer ${response.data.access_token}`;
              originalRequest.headers.Authorization = `Bearer ${response.data.access_token}`;

              // Retry original request
              logApiOperation("request-retry");
              return api(originalRequest);
            } else {
              logApiOperation("token-refresh-invalid-response");
              throw new Error("Invalid refresh token response");
            }
          } catch (refreshError) {
            logApiOperation("token-refresh-failed", {
              error: refreshError.message,
            });
            throw refreshError;
          }
        } else {
          logApiOperation("token-refresh-no-token");
          throw new Error("No refresh token available");
        }
      } catch (authError) {
        logApiOperation("auth-error-logout", {
          error: authError.message,
        });

        // Log out on refresh failure
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");

        // Only redirect if we're not already on the login page
        if (
          !window.location.pathname.includes("login") &&
          !window.location.search.includes("modal=login")
        ) {
          window.location.href = "/?modal=login";
        }
      }
    }

    return Promise.reject(error);
  }
);

// Enhanced fetch with credentials method
const fetchWithCredentials = async (url, method = "GET", data = null) => {
  apiLogger.log("fetchWithCredentials started", {
    url,
    method,
  });

  try {
    // Determine if the URL is absolute or needs the base URL
    const isAbsoluteUrl = url.startsWith("http");
    const fullUrl = isAbsoluteUrl ? url : `${apiBaseUrl}${url}`;
    apiLogger.log("Using URL", { fullUrl });

    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Origin: window.location.origin,
      },
      credentials: "include",
      mode: "cors",
    };

    if (data) {
      options.body = JSON.stringify(data);
      logApiOperation("fetchWithCredentials-data", {
        dataKeys: Object.keys(data),
      });
    }

    const token = localStorage.getItem("accessToken");
    if (token) {
      options.headers.Authorization = `Bearer ${token}`;
      logApiOperation("fetchWithCredentials-token-added");
    }

    apiLogger.log("Fetch request details", {
      url: fullUrl,
      method,
      headers: options.headers,
      mode: options.mode,
    });

    const response = await fetch(fullUrl, options);
    apiLogger.log("Fetch response received", {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText,
    });

    if (!response.ok) {
      let errorText = "";
      try {
        errorText = await response.text();
        apiLogger.error("Fetch error response", {
          text: errorText,
          status: response.status,
        });
      } catch (textError) {
        apiLogger.error("Failed to parse error response", {
          error: textError.message,
        });
      }

      throw new Error(
        `Request failed: ${response.status} ${response.statusText}. ${errorText}`
      );
    }

    const responseData = await response.json();
    apiLogger.success("Fetch successful", {
      dataKeys: Object.keys(responseData),
    });

    return responseData;
  } catch (error) {
    apiLogger.error("Fetch failed", {
      url,
      method,
      message: error.message,
    });

    // Add to errors collection
    if (window.apiDebug) {
      window.apiDebug.errors.push({
        time: new Date().toISOString(),
        operation: `fetchWithCredentials-${method}`,
        url: url,
        error: error.message,
        stack: error.stack,
      });
    }

    throw error;
  }
};

// Export API methods with error handling and logging
const apiClient = {
  get: async (url, config = {}) => {
    try {
      logApiOperation("get-started", { url });
      const response = await api.get(url, config);
      logApiOperation("get-success", { url });
      return response;
    } catch (error) {
      logApiOperation("get-error", {
        url,
        message: error.message,
      });
      throw error;
    }
  },

  post: async (url, data = {}, config = {}) => {
    try {
      logApiOperation("post-started", { url });
      const response = await api.post(url, data, config);
      logApiOperation("post-success", { url });
      return response;
    } catch (error) {
      logApiOperation("post-error", {
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
      logApiOperation("put-started", { url });
      const response = await api.put(url, data, config);
      logApiOperation("put-success", { url });
      return response;
    } catch (error) {
      logApiOperation("put-error", {
        url,
        message: error.message,
      });
      throw error;
    }
  },

  delete: async (url, config = {}) => {
    try {
      logApiOperation("delete-started", { url });
      const response = await api.delete(url, config);
      logApiOperation("delete-success", { url });
      return response;
    } catch (error) {
      logApiOperation("delete-error", {
        url,
        message: error.message,
      });
      throw error;
    }
  },
};

export default apiClient;
