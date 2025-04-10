/**
 * API Service
 * Consolidated entry point for all API services
 */

import { client } from '../client';
import { universesApi } from './universesApi';
import { scenesApi } from './scenesApi';
import { charactersApi } from './charactersApi';
import { authApi } from './authApi';
import { userApi } from './userApi';
import { notesApi } from './notesApi';
import { physicsApi } from './physicsApi';
import { audioApi } from './audioApi';
import { systemApi } from './systemApi';
import { utilityApi } from './utilityApi';
import { IS_PRODUCTION } from '../../utils/config';

/**
 * Consolidated API service
 * Exports all API modules as a single object
 */
const apiService = {
  // Domain-specific APIs
  universes: universesApi,
  scenes: scenesApi,
  characters: charactersApi,
  auth: authApi,
  user: userApi,
  notes: notesApi,
  physics: physicsApi,
  audio: audioApi,
  system: systemApi,
  
  // Utility functions
  utils: utilityApi,
  
  // Client instance for direct access
  client,
  
  // Environment information
  isProduction: IS_PRODUCTION,
};

// For convenience, also export individual APIs
export { 
  universesApi,
  scenesApi,
  charactersApi,
  authApi,
  userApi,
  notesApi,
  physicsApi,
  audioApi,
  systemApi,
  utilityApi,
  client
};

// Export the consolidated API service as default
export default apiService; 