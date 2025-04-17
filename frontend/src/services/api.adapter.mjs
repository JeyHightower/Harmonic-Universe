/**
 * API Compatibility Layer
 * Provides a drop-in replacement for the old API module
 * Redirects calls to the new service structure
 */

// Import HTTP client for convenience methods
import { httpClient } from './http-client';
// Import endpoints for direct access
import { endpoints } from './endpoints';
// Import individual services for direct access
import { 
  authService, 
  universeService, 
  sceneService, 
  characterService,
  noteService,
  userService,
  audioService,
  systemService
} from './index';

// Re-export endpoints for components that import them directly
export { endpoints };

/**
 * Authentication service wrapper
 */
export const auth = {
  login: authService.login,
  register: authService.register,
  logout: authService.logout,
  refreshToken: authService.refreshToken,
  validateToken: authService.validateToken,
  isAuthenticated: authService.isAuthenticated,
  isDemoUser: authService.isDemoUser,
  getAxiosInstance: () => httpClient.axiosInstance
};

/**
 * Create a compatibility wrapper for universe operations
 */
const universes = {
  getUniverses: universeService.getAllUniverses,
  getUniverse: universeService.getUniverseById,
  createUniverse: universeService.createUniverse,
  updateUniverse: universeService.updateUniverse,
  deleteUniverse: universeService.deleteUniverse,
  getUniverseScenes: (universeId) => sceneService.getScenesByUniverse(universeId),
  getUniverseCharacters: (universeId) => characterService.getCharactersByUniverse(universeId)
};

/**
 * Create a compatibility wrapper for scene operations
 */
const scenes = {
  getScenes: sceneService.getAllScenes,
  getScene: sceneService.getSceneById,
  createScene: sceneService.createScene,
  updateScene: sceneService.updateScene,
  deleteScene: sceneService.deleteScene,
  getScenesByUniverse: sceneService.getScenesByUniverse,
  reorderScenes: sceneService.reorderScenes,
  getSceneSettings: sceneService.getSceneSettings,
  updateSceneSettings: sceneService.updateSceneSettings
};

/**
 * Create a compatibility wrapper for character operations
 */
const characters = {
  getCharacters: characterService.getAllCharacters,
  getCharacter: characterService.getCharacterById,
  createCharacter: characterService.createCharacter,
  updateCharacter: characterService.updateCharacter,
  deleteCharacter: characterService.deleteCharacter,
  getCharactersByUniverse: characterService.getCharactersByUniverse,
  getCharactersByScene: characterService.getCharactersByScene,
  getCharacterRelationships: characterService.getCharacterRelationships,
  updateCharacterAttributes: characterService.updateCharacterAttributes
};

/**
 * Create a compatibility wrapper for note operations
 */
const notes = {
  getNotes: noteService.getAllNotes,
  getNote: noteService.getNoteById,
  createNote: noteService.createNote,
  updateNote: noteService.updateNote,
  deleteNote: noteService.deleteNote,
  getNotesByUniverse: noteService.getNotesByUniverse,
  getNotesByScene: noteService.getNotesByScene,
  getNotesByCharacter: noteService.getNotesByCharacter
};

/**
 * Create a compatibility wrapper for user operations
 */
const user = {
  getProfile: userService.getProfile,
  updateProfile: userService.updateProfile,
  changePassword: userService.changePassword,
  deleteAccount: userService.deleteAccount,
  getPreferences: userService.getPreferences,
  updatePreferences: userService.updatePreferences
};

/**
 * Create a compatibility wrapper for audio operations
 */
const audio = {
  getAudioTracks: audioService.getAudioTracks,
  getAudioTrack: audioService.getAudioTrack,
  createAudioTrack: audioService.createAudioTrack,
  updateAudioTrack: audioService.updateAudioTrack,
  deleteAudioTrack: audioService.deleteAudioTrack,
  getAudioTracksByUniverse: audioService.getAudioTracksByUniverse,
  getAudioTracksByScene: audioService.getAudioTracksByScene,
  generateMusic: audioService.generateMusic,
  downloadMusic: audioService.downloadMusic
};

/**
 * Create a compatibility wrapper for system operations
 */
const system = {
  checkHealth: systemService.checkHealth,
  getVersion: systemService.getVersion,
  ping: systemService.ping,
  getSystemConfig: systemService.getSystemConfig,
  getSystemMetrics: systemService.getSystemMetrics
};

// Build the main API object with all the functionality
const api = {
  // Domain services
  auth,
  universes,
  scenes,
  characters,
  notes,
  user,
  audio,
  system,
  
  // Original endpoints reference
  endpoints,

  // Helper methods
  clearCache: httpClient.clearCache,
  formatUrl: httpClient.formatUrl,
  
  // Convenience methods for HTTP operations
  get: httpClient.get,
  post: httpClient.post,
  put: httpClient.put,
  delete: httpClient.delete,
  patch: httpClient.patch
};

// For older code that uses the named export
export const apiClient = api;

// For components that use the default export
export default api; 