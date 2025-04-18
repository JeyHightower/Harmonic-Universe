/**
 * API Endpoints
 * Single source of truth for all API endpoints
 */

import { API_SERVICE_CONFIG } from './config';

const { API_PREFIX } = API_SERVICE_CONFIG;

/**
 * Build endpoint with base path and optional parameters
 * @param {string} path - The endpoint path
 * @returns {string} The full endpoint
 */
const endpoint = (path) => {
  // Ensure path starts with a slash if not empty
  const formattedPath = path.startsWith('/') ? path : `/${path}`;

  // Add trailing slash if not present to avoid redirects
  const pathWithTrailingSlash = formattedPath.endsWith('/') ? formattedPath : `${formattedPath}/`;

  // Don't add API_PREFIX here as it will be added by formatUrl in http-client.mjs
  console.log(`Endpoint: ${path} -> ${pathWithTrailingSlash}`);
  return pathWithTrailingSlash;
};

/**
 * Create endpoint without adding trailing slash
 * Used for endpoints that explicitly don't want a trailing slash
 */
const endpointNoSlash = (path) => {
  // Ensure path starts with a slash if not empty
  const formattedPath = path.startsWith('/') ? path : `/${path}`;

  // Don't add API_PREFIX here as it will be added by formatUrl in http-client.mjs
  console.log(`Endpoint (no slash): ${path} -> ${formattedPath}`);
  return formattedPath;
};

/**
 * Authentication Endpoints
 */
export const authEndpoints = {
  login: endpoint('/auth/login'),
  register: endpoint('/auth/signup'),
  demoLogin: endpoint('/auth/demo-login'),
  refresh: endpointNoSlash('/auth/refresh'),
  logout: endpoint('/auth/logout/'),
  validate: endpoint('/auth/validate/'),
};

/**
 * User Endpoints
 */
export const userEndpoints = {
  profile: endpoint('/user/profile'),
  update: endpoint('/user/update'),
  changePassword: endpoint('/user/change-password'),
  delete: endpoint('/user/delete'),
};

/**
 * Universe Endpoints
 */
export const universeEndpoints = {
  list: endpoint('/universes/'),
  create: endpoint('/universes/'),
  get: (id) => endpoint(`/universes/${id}`),
  update: (id) => endpoint(`/universes/${id}`),
  delete: (id) => endpoint(`/universes/${id}`),
  physics: (id) => endpoint(`/universes/${id}/physics`),
  audio: (id) => endpoint(`/universes/${id}/audio`),
  visualization: (id) => endpoint(`/universes/${id}/visualization`),
  generateMusic: (id) => endpoint(`/universes/${id}/generate-music`),
  saveMusic: (id) => endpoint(`/universes/${id}/save-music`),
  downloadMusic: (id) => endpoint(`/universes/${id}/download-music`),
  getMusic: (id, musicId) => endpoint(`/universes/${id}/music/${musicId}`),
  deleteMusic: (id, musicId) => endpoint(`/universes/${id}/music/${musicId}`),
};

/**
 * Scene Endpoints
 */
export const sceneEndpoints = {
  list: endpoint('/scenes'),
  create: endpoint('/scenes'),
  get: (id) => endpoint(`/scenes/${id}`),
  update: (id) => endpoint(`/scenes/${id}`),
  delete: (id) => endpoint(`/scenes/${id}`),
  byUniverse: (universeId) => endpoint(`/scenes/universe/${universeId}`),
  reorder: endpoint('/scenes/reorder'),
  characters: (id) => endpoint(`/scenes/${id}/characters`),
  notes: (id) => endpoint(`/scenes/${id}/notes`),
};

/**
 * Character Endpoints
 */
export const characterEndpoints = {
  list: endpoint('/characters'),
  create: endpoint('/characters'),
  get: (id) => endpoint(`/characters/${id}`),
  update: (id) => endpoint(`/characters/${id}`),
  delete: (id) => endpoint(`/characters/${id}`),
  forUniverse: (universeId) => endpoint(`/characters/universe/${universeId}`),
  forScene: (sceneId) => endpoint(`/characters/scene/${sceneId}`),
  notes: (id) => endpoint(`/characters/${id}/notes`),
};

/**
 * Note Endpoints
 */
export const noteEndpoints = {
  list: endpoint('/notes'),
  create: endpoint('/notes'),
  get: (id) => endpoint(`/notes/${id}`),
  update: (id) => endpoint(`/notes/${id}`),
  delete: (id) => endpoint(`/notes/${id}`),
  forUniverse: (universeId) => endpoint(`/notes/universe/${universeId}`),
  forScene: (sceneId) => endpoint(`/notes/scene/${sceneId}`),
  forCharacter: (characterId) => endpoint(`/notes/character/${characterId}`),
};

/**
 * Physics Endpoints
 */
export const physicsEndpoints = {
  objects: {
    list: (universeId) => endpoint(`/universes/${universeId}/objects`),
    create: (universeId) => endpoint(`/universes/${universeId}/objects`),
    get: (universeId, objectId) => endpoint(`/universes/${universeId}/objects/${objectId}`),
    update: (universeId, objectId) => endpoint(`/universes/${universeId}/objects/${objectId}`),
    delete: (universeId, objectId) => endpoint(`/universes/${universeId}/objects/${objectId}`),
  },
  parameters: {
    get: (universeId) => endpoint(`/universes/${universeId}/physics`),
    update: (universeId) => endpoint(`/universes/${universeId}/physics`),
  },
};

/**
 * Audio Endpoints
 */
export const audioEndpoints = {
  tracks: {
    list: (universeId) => endpoint(`/universes/${universeId}/audio-tracks`),
    create: (universeId) => endpoint(`/universes/${universeId}/audio-tracks`),
    get: (universeId, trackId) => endpoint(`/universes/${universeId}/audio-tracks/${trackId}`),
    update: (universeId, trackId) => endpoint(`/universes/${universeId}/audio-tracks/${trackId}`),
    delete: (universeId, trackId) => endpoint(`/universes/${universeId}/audio-tracks/${trackId}`),
    byScene: (sceneId) => endpoint(`/scenes/${sceneId}/audio-tracks`),
  },
  generate: (universeId) => endpoint(`/universes/${universeId}/generate-music`),
  download: (universeId) => endpoint(`/universes/${universeId}/download-music`),
};

/**
 * System Endpoints
 */
export const systemEndpoints = {
  health: endpoint('/health'),
  version: endpoint('/version'),
  ping: endpoint('/ping'),
};

/**
 * Export all endpoints
 */
export const endpoints = {
  auth: authEndpoints,
  user: userEndpoints,
  universes: universeEndpoints,
  scenes: sceneEndpoints,
  characters: characterEndpoints,
  notes: noteEndpoints,
  physics: physicsEndpoints,
  audio: audioEndpoints,
  system: systemEndpoints,
};

/**
 * Helper function to get an endpoint by group and name
 * @param {string} group - The endpoint group (e.g., 'universes')
 * @param {string} name - The endpoint name (e.g., 'list')
 * @param {Array} params - Optional parameters for the endpoint
 * @returns {string} The full endpoint URL
 */
export const getEndpoint = (group, name, params = []) => {
  if (!endpoints[group]) {
    throw new Error(`Endpoint group '${group}' not found`);
  }

  const endpointFn = endpoints[group][name];
  if (!endpointFn) {
    throw new Error(`Endpoint '${name}' not found in group '${group}'`);
  }

  return typeof endpointFn === 'function' ? endpointFn(...params) : endpointFn;
};

export default endpoints;
