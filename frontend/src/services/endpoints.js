/**
 * API Endpoints
 * This file contains all the API endpoints used by the application.
 */

import { API_CONFIG } from '../utils/config';

console.log("Loading endpoints.js module");

// Base API URL
const API_BASE_URL = API_CONFIG.BASE_URL;

// API version prefix - remove this as we're already using /api in the base URL
const API_VERSION = '';

// Auth endpoints
const authEndpoints = {
  login: `${API_VERSION}/auth/login`,
  register: `${API_VERSION}/auth/signup`,
  signup: `${API_VERSION}/auth/signup`,
  demoLogin: `${API_VERSION}/auth/demo-login`,
  refresh: `${API_VERSION}/auth/refresh`,
  logout: `${API_VERSION}/auth/logout`,
  resetPassword: `${API_VERSION}/auth/reset-password`,
  forgotPassword: `${API_VERSION}/auth/forgot-password`,
  verifyEmail: `${API_VERSION}/auth/verify-email`,
  validate: `${API_VERSION}/auth/validate`,
};

// User endpoints
const userEndpoints = {
  profile: `${API_VERSION}/user/profile`,
  update: `${API_VERSION}/user/update`,
  changePassword: `${API_VERSION}/user/change-password`,
  delete: `${API_VERSION}/user/delete`,
};

// Universe endpoints
const universeEndpoints = {
  list: `${API_VERSION}/universes`,
  create: `${API_VERSION}/universes`,
  get: (id) => `${API_VERSION}/universes/${id}`,
  update: (id) => `${API_VERSION}/universes/${id}`,
  delete: (id) => `${API_VERSION}/universes/${id}`,
  physics: (id) => `${API_VERSION}/universes/${id}/physics`,
  audio: (id) => `${API_VERSION}/universes/${id}/audio`,
  visualization: (id) => `${API_VERSION}/universes/${id}/visualization`,
  scenes: (id) => {
    // Log a deprecation warning
    console.warn(
      `[Deprecation Warning] The endpoint ${API_VERSION}/universes/${id}/scenes is deprecated. ` +
      `Please use ${API_VERSION}/scenes/universe/${id} instead.`
    );
    // Still use the legacy endpoint which will redirect to the primary endpoint
    return `${API_VERSION}/universes/${id}/scenes`;
  },
  characters: (id) => `${API_VERSION}/universes/${id}/characters`,
  notes: (id) => `${API_VERSION}/universes/${id}/notes`,
};

// Log the universe endpoints for debugging
console.log("Universe endpoints defined:", universeEndpoints);

// Scene endpoints
const sceneEndpoints = {
  list: `${API_VERSION}/scenes`,
  create: `${API_VERSION}/scenes`,
  get: (id) => `${API_VERSION}/scenes/${id}`,
  update: (id) => `${API_VERSION}/scenes/${id}`,
  delete: (id) => `${API_VERSION}/scenes/${id}`,
  // Add the primary endpoint for getting scenes by universe
  byUniverse: (universeId) => `${API_VERSION}/scenes/universe/${universeId}`,
  // Keep legacy endpoint for backward compatibility
  forUniverse: (universeId) => {
    console.warn(
      `[Deprecation Warning] The endpoint ${API_VERSION}/universes/${universeId}/scenes is deprecated. ` +
      `Please use ${API_VERSION}/scenes/universe/${universeId} instead.`
    );
    return `${API_VERSION}/universes/${universeId}/scenes`;
  },
  reorder: `${API_VERSION}/scenes/reorder`,
  characters: (id) => `${API_VERSION}/scenes/${id}/characters`,
  notes: (id) => `${API_VERSION}/scenes/${id}/notes`,
};

// Character endpoints
const characterEndpoints = {
  list: `${API_VERSION}/characters`,
  create: `${API_VERSION}/characters`,
  get: (id) => `${API_VERSION}/characters/${id}`,
  update: (id) => `${API_VERSION}/characters/${id}`,
  delete: (id) => `${API_VERSION}/characters/${id}`,
  forUniverse: (universeId) => `${API_VERSION}/universes/${universeId}/characters`,
  forScene: (sceneId) => `${API_VERSION}/scenes/${sceneId}/characters`,
  notes: (id) => `${API_VERSION}/characters/${id}/notes`,
};

// Note endpoints
const noteEndpoints = {
  list: `${API_VERSION}/notes`,
  create: `${API_VERSION}/notes`,
  get: (id) => `${API_VERSION}/notes/${id}`,
  update: (id) => `${API_VERSION}/notes/${id}`,
  delete: (id) => `${API_VERSION}/notes/${id}`,
  forUniverse: (universeId) => `${API_VERSION}/universes/${universeId}/notes`,
  forScene: (sceneId) => `${API_VERSION}/scenes/${sceneId}/notes`,
  forCharacter: (characterId) => `${API_VERSION}/characters/${characterId}/notes`,
};

// Physics objects endpoints
const physicsObjectEndpoints = {
  list: (universeId) => `${API_VERSION}/universes/${universeId}/objects`,
  create: (universeId) => `${API_VERSION}/universes/${universeId}/objects`,
  get: (universeId, objectId) =>
    `${API_VERSION}/universes/${universeId}/objects/${objectId}`,
  update: (universeId, objectId) =>
    `${API_VERSION}/universes/${universeId}/objects/${objectId}`,
  delete: (universeId, objectId) =>
    `${API_VERSION}/universes/${universeId}/objects/${objectId}`,
};

// Audio tracks endpoints
const audioTrackEndpoints = {
  list: (universeId) => `${API_VERSION}/universes/${universeId}/audio-tracks`,
  create: (universeId) =>
    `${API_VERSION}/universes/${universeId}/audio-tracks`,
  get: (universeId, trackId) =>
    `${API_VERSION}/universes/${universeId}/audio-tracks/${trackId}`,
  update: (universeId, trackId) =>
    `${API_VERSION}/universes/${universeId}/audio-tracks/${trackId}`,
  delete: (universeId, trackId) =>
    `${API_VERSION}/universes/${universeId}/audio-tracks/${trackId}`,
};

// System endpoints
const systemEndpoints = {
  health: `${API_VERSION}/health`,
  version: `${API_VERSION}/version`,
};

// Export all endpoints
export const endpoints = {
  auth: authEndpoints,
  user: userEndpoints,
  universes: universeEndpoints,
  scenes: sceneEndpoints,
  characters: characterEndpoints,
  notes: noteEndpoints,
  physicsObjects: physicsObjectEndpoints,
  audioTracks: audioTrackEndpoints,
  system: systemEndpoints,
};

// Log the exported endpoints for debugging
console.log("All endpoints exported:", {
  hasAuth: !!endpoints.auth,
  hasUniverses: !!endpoints.universes,
  universesCreate: endpoints.universes?.create
});

// Add the missing export to endpoints.js as specified in the solution
export const universesEndpoints = {
  // Define universe endpoints here
  getUniverses: `${API_VERSION}/universes`,
  getUniverseById: (id) => `${API_VERSION}/universes/${id}`,
  // Add other universe-related endpoints
  createUniverse: `${API_VERSION}/universes`,
  updateUniverse: (id) => `${API_VERSION}/universes/${id}`,
  deleteUniverse: (id) => `${API_VERSION}/universes/${id}`,
  getUniverseScenes: (id) => {
    // Log a deprecation warning
    console.warn(
      `[Deprecation Warning] The endpoint ${API_VERSION}/universes/${id}/scenes is deprecated. ` +
      `Please use ${API_VERSION}/scenes/universe/${id} instead.`
    );
    // Still use the legacy endpoint which will redirect to the primary endpoint
    return `${API_VERSION}/universes/${id}/scenes`;
  },
  getUniverseCharacters: (id) => `${API_VERSION}/universes/${id}/characters`,
  getUniverseNotes: (id) => `${API_VERSION}/universes/${id}/notes`,
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

  // Ensure endpoint doesn't start with '/api' as that's already in the base URL
  return endpoint.startsWith('/api') ? endpoint : endpoint;
};

// Export default for easier imports
export default endpoints;