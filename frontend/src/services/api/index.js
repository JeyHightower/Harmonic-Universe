/**
 * API Service
 * Consolidated entry point for all API services
 */

import { client } from '../client';
import { authApi } from './authApi';
import { audioApi } from './audioApi';
import { baseApi } from './baseApi';
import { httpService } from './httpService';
import { musicApi } from './musicApi';
import { responseHandler } from './responseHandler';
import { utilityApi } from './utilityApi';
import { IS_PRODUCTION } from '../../utils';
import { endpoints } from '../endpoints';
import * as mainApi from '../api';

// Create domain-specific API interfaces from the main API file
const universesApi = {
  getAll: mainApi.getUniverses,
  getById: mainApi.getUniverse,
  create: mainApi.createUniverse,
  update: mainApi.updateUniverse,
  delete: mainApi.deleteUniverse,
  getScenes: mainApi.getUniverseScenes,
  getCharacters: mainApi.getUniverseCharacters
};

const scenesApi = {
  getAll: mainApi.getScenes,
  getById: mainApi.getScene,
  create: mainApi.createScene,
  update: mainApi.updateScene,
  delete: mainApi.deleteScene
};

const charactersApi = {
  getAll: mainApi.getCharacters,
  getById: mainApi.getCharacter,
  create: mainApi.createCharacter,
  update: mainApi.updateCharacter,
  delete: mainApi.deleteCharacter
};

const notesApi = {
  getAll: mainApi.getNotes,
  getById: mainApi.getNote,
  create: mainApi.createNote,
  update: mainApi.updateNote,
  delete: mainApi.deleteNote
};

const userApi = {
  getProfile: mainApi.getUserProfile,
  updateProfile: mainApi.updateUserProfile
};

const physicsApi = {
  getObjects: mainApi.getPhysicsObjects,
  getParameters: mainApi.getPhysicsParameters,
  updateParameters: mainApi.updatePhysicsParameters
};

const systemApi = {
  ping: mainApi.ping,
  getStatus: mainApi.getSystemStatus
};

/**
 * Consolidated API service
 * Exports all API modules as a single object
 */
const apiService = {
  // Core API services
  base: baseApi,
  http: httpService,
  response: responseHandler,
  
  // Domain-specific APIs
  auth: authApi,
  universes: universesApi,
  scenes: scenesApi,
  characters: charactersApi,
  user: userApi,
  notes: notesApi,
  physics: physicsApi,
  audio: audioApi,
  music: musicApi,
  system: systemApi,
  
  // Utility functions
  utils: utilityApi,
  
  // Client instance for direct access
  client,
  
  // Raw API functions
  raw: mainApi,
  
  // Endpoints reference
  endpoints,
  
  // Environment information
  isProduction: IS_PRODUCTION,
};

// For convenience, also export individual APIs
export { 
  authApi,
  audioApi,
  baseApi,
  charactersApi,
  client,
  httpService,
  musicApi,
  notesApi,
  physicsApi,
  responseHandler,
  scenesApi,
  systemApi,
  universesApi,
  userApi,
  utilityApi,
  mainApi as rawApi,
  endpoints
};

// Export the consolidated API service as default
export default apiService; 