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

// Configure API client with environment-aware base URL
const API_BASE_URL = IS_PRODUCTION
  ? '/api' // Use relative URL in production
  : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api');

console.log(`API Base URL: ${API_BASE_URL}`);

// Create the API client with proper configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_CONFIG.TIMEOUT || 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true // Important for authentication
});

// Add request interceptor for authentication
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Server responded with an error status
      if (error.response.status === 401) {
        // Handle unauthorized errors (e.g., token expired)
        console.log("Authentication error:", error.response.data);
        // Redirect to login or refresh token
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error("Network error:", error.request);
    } else {
      // Error setting up the request
      console.error("Request error:", error.message);
    }
    return Promise.reject(error);
  }
);

// Export the API client
export default apiClient;