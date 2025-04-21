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
 * Safely convert an ID to a valid format for URL paths
 * @param {any} id - The ID to convert
 * @returns {string|number|null} - A valid ID for use in URLs or null for invalid inputs
 */
export const safeId = (id) => {
  if (id === undefined || id === null) {
    console.error('Invalid ID (undefined or null) provided to endpoint');
    // Return null instead of 'invalid-id' string to make it easier to check for invalid values
    return null;
  }

  // If it's already a number, return it directly
  if (typeof id === 'number' && !isNaN(id) && id > 0) {
    return id;
  }

  // If it's a string, try to convert to a number if it looks like one
  if (typeof id === 'string') {
    if (/^\d+$/.test(id)) {
      const parsedId = parseInt(id, 10);
      // Ensure it's a positive number
      return parsedId > 0 ? parsedId : null;
    }
    // Otherwise, return the string as is if it's not empty
    return id.trim() ? id : null;
  }

  // For any other type, convert to string if possible
  const stringId = String(id);
  return stringId.trim() ? stringId : null;
};

/**
 * Authentication Endpoints
 */
export const authEndpoints = {
  login: endpoint('/auth/login'),
  register: endpoint('/auth/signup'),
  demoLogin: endpoint('/auth/demo-login'),
  refresh: endpoint('/auth/refresh'),
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
  get: (id) => endpoint(`/universes/${safeId(id)}`),
  update: (id) => endpoint(`/universes/${safeId(id)}`),
  delete: (id) => endpoint(`/universes/${safeId(id)}`),
  physics: (id) => endpoint(`/universes/${safeId(id)}/physics`),
  audio: (id) => endpoint(`/universes/${safeId(id)}/audio`),
  visualization: (id) => endpoint(`/universes/${safeId(id)}/visualization`),
  generateMusic: (id) => endpoint(`/universes/${safeId(id)}/generate-music`),
  saveMusic: (id) => endpoint(`/universes/${safeId(id)}/save-music`),
  downloadMusic: (id) => endpoint(`/universes/${safeId(id)}/download-music`),
  getMusic: (id, musicId) => endpoint(`/universes/${safeId(id)}/music/${safeId(musicId)}`),
  deleteMusic: (id, musicId) => endpoint(`/universes/${safeId(id)}/music/${safeId(musicId)}`),
};

/**
 * Scene Endpoints
 */
export const sceneEndpoints = {
  list: endpoint('/scenes/'),
  create: endpoint('/scenes/'),
  get: (id) => endpoint(`/scenes/${safeId(id)}/`),
  update: (id) => endpoint(`/scenes/${safeId(id)}/`),
  delete: (id) => endpoint(`/scenes/${safeId(id)}/`),
  forUniverse: (universeId) => endpoint(`/universes/${safeId(universeId)}/scenes/`),
  byUniverse: (universeId) => endpoint(`/scenes/universe/${safeId(universeId)}/`),
  reorder: endpoint('/scenes/reorder/'),
  characters: (id) => endpoint(`/scenes/${safeId(id)}/characters/`),
  notes: (id) => endpoint(`/scenes/${safeId(id)}/notes/`),
  settings: (id) => endpoint(`/scenes/${safeId(id)}/settings/`),
};

/**
 * Character Endpoints
 */
export const characterEndpoints = {
  list: endpoint('/characters'),
  create: endpoint('/characters'),
  get: (id) => endpoint(`/characters/${safeId(id)}`),
  update: (id) => endpoint(`/characters/${safeId(id)}`),
  delete: (id) => endpoint(`/characters/${safeId(id)}`),
  forUniverse: (universeId) => endpoint(`/universes/${safeId(universeId)}/characters`),
  byUniverse: (universeId) => endpoint(`/universes/${safeId(universeId)}/characters`),
  forScene: (sceneId) => endpoint(`/characters/scene/${safeId(sceneId)}`),
  notes: (id) => endpoint(`/characters/${safeId(id)}/notes`),
  relationships: (id) => endpoint(`/characters/${safeId(id)}/relationships`),
  attributes: (id) => endpoint(`/characters/${safeId(id)}/attributes`),
};

/**
 * Note Endpoints
 */
export const noteEndpoints = {
  list: endpoint('/notes'),
  create: endpoint('/notes'),
  get: (id) => endpoint(`/notes/${safeId(id)}`),
  update: (id) => endpoint(`/notes/${safeId(id)}`),
  delete: (id) => endpoint(`/notes/${safeId(id)}`),
  forUniverse: (universeId) => endpoint(`/notes/universe/${safeId(universeId)}`),
  forScene: (sceneId) => endpoint(`/notes/scene/${safeId(sceneId)}`),
  forCharacter: (characterId) => endpoint(`/notes/character/${safeId(characterId)}`),
};

/**
 * Physics Endpoints
 */
export const physicsEndpoints = {
  objects: {
    list: (universeId) => endpoint(`/universes/${safeId(universeId)}/objects`),
    create: (universeId) => endpoint(`/universes/${safeId(universeId)}/objects`),
    get: (universeId, objectId) =>
      endpoint(`/universes/${safeId(universeId)}/objects/${safeId(objectId)}`),
    update: (universeId, objectId) =>
      endpoint(`/universes/${safeId(universeId)}/objects/${safeId(objectId)}`),
    delete: (universeId, objectId) =>
      endpoint(`/universes/${safeId(universeId)}/objects/${safeId(objectId)}`),
  },
  parameters: {
    get: (universeId) => endpoint(`/universes/${safeId(universeId)}/physics`),
    update: (universeId) => endpoint(`/universes/${safeId(universeId)}/physics`),
  },
};

/**
 * Audio Endpoints
 */
export const audioEndpoints = {
  tracks: {
    list: (universeId) => endpoint(`/universes/${safeId(universeId)}/audio-tracks`),
    create: (universeId) => endpoint(`/universes/${safeId(universeId)}/audio-tracks`),
    get: (universeId, trackId) =>
      endpoint(`/universes/${safeId(universeId)}/audio-tracks/${safeId(trackId)}`),
    update: (universeId, trackId) =>
      endpoint(`/universes/${safeId(universeId)}/audio-tracks/${safeId(trackId)}`),
    delete: (universeId, trackId) =>
      endpoint(`/universes/${safeId(universeId)}/audio-tracks/${safeId(trackId)}`),
    byScene: (sceneId) => endpoint(`/scenes/${safeId(sceneId)}/audio-tracks`),
  },
  generate: (universeId) => endpoint(`/universes/${safeId(universeId)}/generate-music`),
  download: (universeId) => endpoint(`/universes/${safeId(universeId)}/download-music`),
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
