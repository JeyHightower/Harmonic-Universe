/**
 * API Endpoints
 * This file contains all the API endpoints used by the application.
 */

// Base API URL
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";
const API_V1_URL = `${API_BASE_URL}/v1`;

// Auth endpoints
const authEndpoints = {
  login: `${API_BASE_URL}/auth/login`,
  register: `${API_BASE_URL}/auth/signup`,
  demoLogin: `${API_BASE_URL}/auth/demo-login`,
  refresh: `${API_BASE_URL}/auth/refresh`,
  logout: `${API_BASE_URL}/auth/logout`,
  me: `${API_BASE_URL}/auth/me`,
  resetPassword: `${API_BASE_URL}/auth/reset-password`,
  forgotPassword: `${API_BASE_URL}/auth/forgot-password`,
  verifyEmail: `${API_BASE_URL}/auth/verify-email`,
};

// Versioned auth endpoints (for fallback)
const authV1Endpoints = {
  login: `${API_V1_URL}/auth/login`,
  register: `${API_V1_URL}/auth/signup`,
  demoLogin: `${API_V1_URL}/auth/demo-login`,
  refresh: `${API_V1_URL}/auth/refresh`,
  logout: `${API_V1_URL}/auth/logout`,
  me: `${API_V1_URL}/auth/me`,
};

// User endpoints
const userEndpoints = {
  profile: `${API_BASE_URL}/users/profile`,
  update: `${API_BASE_URL}/users/update`,
  changePassword: `${API_BASE_URL}/users/change-password`,
  delete: `${API_BASE_URL}/users/delete`,
};

// Universe endpoints
const universeEndpoints = {
  list: `${API_BASE_URL}/universes`,
  create: `${API_BASE_URL}/universes`,
  get: (id) => `${API_BASE_URL}/universes/${id}`,
  update: (id) => `${API_BASE_URL}/universes/${id}`,
  delete: (id) => `${API_BASE_URL}/universes/${id}`,
  physics: (id) => `${API_BASE_URL}/universes/${id}/physics`,
  audio: (id) => `${API_BASE_URL}/universes/${id}/audio`,
  visualization: (id) => `${API_BASE_URL}/universes/${id}/visualization`,
};

// Physics objects endpoints
const physicsObjectEndpoints = {
  list: (universeId) => `${API_BASE_URL}/universes/${universeId}/objects`,
  create: (universeId) => `${API_BASE_URL}/universes/${universeId}/objects`,
  get: (universeId, objectId) =>
    `${API_BASE_URL}/universes/${universeId}/objects/${objectId}`,
  update: (universeId, objectId) =>
    `${API_BASE_URL}/universes/${universeId}/objects/${objectId}`,
  delete: (universeId, objectId) =>
    `${API_BASE_URL}/universes/${universeId}/objects/${objectId}`,
};

// Audio tracks endpoints
const audioTrackEndpoints = {
  list: (universeId) => `${API_BASE_URL}/universes/${universeId}/audio-tracks`,
  create: (universeId) =>
    `${API_BASE_URL}/universes/${universeId}/audio-tracks`,
  get: (universeId, trackId) =>
    `${API_BASE_URL}/universes/${universeId}/audio-tracks/${trackId}`,
  update: (universeId, trackId) =>
    `${API_BASE_URL}/universes/${universeId}/audio-tracks/${trackId}`,
  delete: (universeId, trackId) =>
    `${API_BASE_URL}/universes/${universeId}/audio-tracks/${trackId}`,
};

// System endpoints
const systemEndpoints = {
  health: `${API_BASE_URL}/health`,
  version: `${API_BASE_URL}/version`,
};

// Export all endpoints
export const endpoints = {
  auth: authEndpoints,
  authV1: authV1Endpoints,
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

  return endpoint;
};
