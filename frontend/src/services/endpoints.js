/**
 * API Endpoints
 * This file contains all the API endpoints used by the application.
 */

import { API_CONFIG } from '../utils/config';

// Base API URL
const API_BASE_URL = API_CONFIG.BASE_URL;

// API version prefix
const API_VERSION = '/api';

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
  users: userEndpoints,
  universes: universeEndpoints,
  physicsObjects: physicsObjectEndpoints,
  audioTracks: audioTrackEndpoints,
  system: systemEndpoints,
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

  // Ensure endpoint starts with API version
  return endpoint.startsWith(API_VERSION) ? endpoint : `${API_VERSION}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
};