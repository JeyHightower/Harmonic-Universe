/**
 * Simplified API client for connecting to the simple_app.py backend
 */
import axios from "axios";
import { AUTH_CONFIG } from "../utils/config.js";

// Create a axios instance for the local API
const localApi = axios.create({
  baseURL: "http://localhost:5001",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Add request interceptor to include auth token
localApi.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    console.log("API Request:", {
      method: config.method?.toUpperCase(),
      url: config.url,
      data: config.data,
    });

    return config;
  },
  (error) => {
    console.error("Request Error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle responses and errors
localApi.interceptors.response.use(
  (response) => {
    console.log("API Response:", {
      status: response.status,
      data: response.data,
    });

    // Return just the data
    return response.data;
  },
  (error) => {
    console.error("API Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    // Format the error
    const formattedError = {
      message:
        error.response?.data?.message ||
        error.message ||
        "An unknown error occurred",
      status: error.response?.status,
      data: error.response?.data,
    };

    return Promise.reject(formattedError);
  }
);

// API client with methods for all entities
export const apiClient = {
  // Auth methods
  login: (credentials) => localApi.post("/api/auth/login", credentials),
  register: (userData) => localApi.post("/api/auth/register", userData),
  logout: () => localApi.post("/api/auth/logout"),
  demoLogin: () => localApi.post("/auth/demo-login"),

  // Universe methods
  getUniverses: () => localApi.get("/api/universes"),
  createUniverse: (data) => localApi.post("/api/universes", data),
  getUniverse: (id) => localApi.get(`/api/universes/${id}`),
  updateUniverse: (id, data) => localApi.put(`/api/universes/${id}`, data),
  deleteUniverse: (id) => localApi.delete(`/api/universes/${id}`),

  // Scene methods
  getScenes: (universeId) =>
    localApi.get(`/api/scenes?universe_id=${universeId}`),
  createScene: (data) => localApi.post("/api/scenes", data),
  getScene: (id) => localApi.get(`/api/scenes/${id}`),
  updateScene: (id, data) => localApi.put(`/api/scenes/${id}`, data),
  deleteScene: (id) => localApi.delete(`/api/scenes/${id}`),
};

export default apiClient;
