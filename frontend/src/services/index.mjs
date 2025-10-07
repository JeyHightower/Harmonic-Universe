/**
 * API Service
 * Main entry point for all API-related services
 */

// Core imports - all in one group to avoid empty lines
import { audioService } from './audio.service.mjs';
import { authService } from './auth.service.mjs';
import { characterService } from './character.service.mjs';
import { API_SERVICE_CONFIG } from './config.mjs';
import { endpoints, getEndpoint } from './endpoints.mjs';
import { httpClient } from './http-client.mjs';
import { noteService } from './note.service.mjs';
import { responseHandler } from './response-handler.mjs';
import { sceneService } from './scene.service.mjs';
import { systemService } from './system.service.mjs';
import { universeService } from './universe.service.mjs';
import { userService } from './user.service.mjs';

/**
 * Core API service object that consolidates all API-related functionality
 */
const apiService = {
  // Core HTTP and utilities
  http: httpClient,
  endpoints,
  config: API_SERVICE_CONFIG,
  response: responseHandler,

  // Domain-specific services
  auth: authService,
  universes: universeService,
  scenes: sceneService,
  characters: characterService,
  notes: noteService,
  users: userService,
  audio: audioService,
  system: systemService,

  // Helper methods
  getEndpoint,

  // Utility methods
  clearCache: httpClient.clearCache,
  formatUrl: httpClient.formatUrl,
};

// Export individual services for direct imports
export {
  API_SERVICE_CONFIG,
  audioService,
  authService,
  characterService,
  endpoints,
  httpClient,
  noteService,
  responseHandler,
  sceneService,
  systemService,
  universeService,
  userService,
};

export { resetAuth } from './auth.service.mjs'
// Export the consolidated service
export default apiService;
