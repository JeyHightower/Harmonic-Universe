/**
 * API Service
 * Main entry point for all API-related services
 */

// Core imports - all in one group to avoid empty lines
import { httpClient } from './http-client';
import { endpoints, getEndpoint } from './endpoints';
import { API_SERVICE_CONFIG } from './config';
import { responseHandler } from './response-handler';
import { authService } from './auth.service';
import { universeService } from './universe.service';
import { sceneService } from './scene.service';
import { characterService } from './character.service';
import { noteService } from './note.service';
import { userService } from './user.service';
import { audioService } from './audio.service';
import { systemService } from './system.service';
import { audioApi } from './audio.adapter';

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
  httpClient,
  endpoints,
  API_SERVICE_CONFIG,
  responseHandler,
  authService,
  universeService,
  sceneService,
  characterService,
  noteService,
  userService,
  audioService,
  systemService,
  audioApi
};

// Export the consolidated service
export default apiService; 