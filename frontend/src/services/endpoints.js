/**
 * API Endpoints
 * This file contains all the API endpoints used by the application.
 */

// Base API URL
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

// Auth endpoints
const authEndpoints = {
  login: `${API_BASE_URL}/api/auth/login`,
  register: `${API_BASE_URL}/api/auth/signup`,
  signup: `${API_BASE_URL}/api/auth/signup`,
  demoLogin: `${API_BASE_URL}/api/auth/demo-login`,
  refresh: `${API_BASE_URL}/api/auth/refresh`,
  logout: `${API_BASE_URL}/api/auth/logout`,
  resetPassword: `${API_BASE_URL}/api/auth/reset-password`,
  forgotPassword: `${API_BASE_URL}/api/auth/forgot-password`,
  verifyEmail: `${API_BASE_URL}/api/auth/verify-email`,
};

// User endpoints
const userEndpoints = {
  profile: `${API_BASE_URL}/api/user/profile`,
  update: `${API_BASE_URL}/api/user/update`,
  changePassword: `${API_BASE_URL}/api/user/change-password`,
  delete: `${API_BASE_URL}/api/user/delete`,
};

// Universe endpoints
const universeEndpoints = {
  list: `${API_BASE_URL}/api/universes`,
  create: `${API_BASE_URL}/api/universes`,
  get: (id) => `${API_BASE_URL}/api/universes/${id}`,
  update: (id) => `${API_BASE_URL}/api/universes/${id}`,
  delete: (id) => `${API_BASE_URL}/api/universes/${id}`,
  physics: (id) => `${API_BASE_URL}/api/universes/${id}/physics`,
  audio: (id) => `${API_BASE_URL}/api/universes/${id}/audio`,
  visualization: (id) => `${API_BASE_URL}/api/universes/${id}/visualization`,
};

// Physics objects endpoints
const physicsObjectEndpoints = {
  list: (universeId) => `${API_BASE_URL}/api/universes/${universeId}/objects`,
  create: (universeId) => `${API_BASE_URL}/api/universes/${universeId}/objects`,
  get: (universeId, objectId) =>
    `${API_BASE_URL}/api/universes/${universeId}/objects/${objectId}`,
  update: (universeId, objectId) =>
    `${API_BASE_URL}/api/universes/${universeId}/objects/${objectId}`,
  delete: (universeId, objectId) =>
    `${API_BASE_URL}/api/universes/${universeId}/objects/${objectId}`,
};

// Audio tracks endpoints
const audioTrackEndpoints = {
  list: (universeId) => `${API_BASE_URL}/api/universes/${universeId}/audio-tracks`,
  create: (universeId) =>
    `${API_BASE_URL}/api/universes/${universeId}/audio-tracks`,
  get: (universeId, trackId) =>
    `${API_BASE_URL}/api/universes/${universeId}/audio-tracks/${trackId}`,
  update: (universeId, trackId) =>
    `${API_BASE_URL}/api/universes/${universeId}/audio-tracks/${trackId}`,
  delete: (universeId, trackId) =>
    `${API_BASE_URL}/api/universes/${universeId}/audio-tracks/${trackId}`,
};

// System endpoints
const systemEndpoints = {
  health: `${API_BASE_URL}/api/health`,
  version: `${API_BASE_URL}/api/version`,
};

// Export all endpoints
export const endpoints = {
  auth: authEndpoints,
  users: userEndpoints,
  universes: universeEndpoints,
  physicsObjects: physicsObjectEndpoints,
  audioTracks: audioTrackEndpoints,
  system: systemEndpoints,
  // Add other endpoint groups as needed
};

// Export endpoint helper functions
export const getEndpoint = (group, name) => {
  if (!endpoints[group]) {
    console.error(`API endpoint group '${group}' not found`);
    return null;
  }

  if (!endpoints[group][name]) {
    console.error(`API endpoint '${name}' not found in group '${group}'`);
    return null;
  }

  return endpoints[group][name];
};

// Helper function to get the correct API endpoint for the current environment
export const getApiEndpoint = (endpoint) => {
  // If the endpoint is a function, execute it with the provided arguments
  if (typeof endpoint === "function") {
    return endpoint;
  }

  // For absolute URLs, return as is
  if (endpoint.startsWith("http")) {
    return endpoint;
  }

  // Check for v1 API prefix
  if (import.meta.env.VITE_API_VERSION === "v1") {
    return `/api/v1${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  }

  // Default to current API version
  return `/api${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
};