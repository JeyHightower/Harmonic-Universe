/**
 * Audio API
 * Legacy adapter for older components that use audioApi directly
 * Redirects to the new audioService
 */

import { audioService } from '../index';

/**
 * Get audio details
 * @param {string|number} universeId - Universe ID
 * @param {string|number} sceneId - Scene ID
 * @param {string|number} audioId - Audio ID
 * @returns {Promise<object>} - Audio details
 */
export const getAudio = (universeId, sceneId, audioId) => {
  console.log('Using legacy audioApi.getAudio, please update to audioService.getAudioTrack');
  return audioService.getAudioTrack(audioId);
};

/**
 * Delete audio
 * @param {string|number} universeId - Universe ID
 * @param {string|number} sceneId - Scene ID
 * @param {string|number} audioId - Audio ID
 * @returns {Promise<object>} - Delete response
 */
export const deleteAudio = (universeId, sceneId, audioId) => {
  console.log('Using legacy audioApi.deleteAudio, please update to audioService.deleteAudioTrack');
  return audioService.deleteAudioTrack(audioId);
};

/**
 * Generate audio
 * @param {string|number} universeId - Universe ID
 * @param {string|number} sceneId - Scene ID
 * @param {object} options - Generation options
 * @returns {Promise<object>} - Generated audio
 */
export const generateAudio = (universeId, sceneId, options) => {
  console.log('Using legacy audioApi.generateAudio, please update to audioService.generateMusic');
  return audioService.generateMusic({
    universeId,
    sceneId,
    ...options
  });
};

/**
 * Save audio
 * @param {string|number} universeId - Universe ID
 * @param {string|number} sceneId - Scene ID
 * @param {object} audioData - Audio data
 * @returns {Promise<object>} - Saved audio
 */
export const saveAudio = (universeId, sceneId, audioData) => {
  console.log('Using legacy audioApi.saveAudio, please update to audioService.createAudioTrack');
  return audioService.createAudioTrack({
    universeId,
    sceneId,
    ...audioData
  });
};

/**
 * Download audio file
 * @param {number|string} universeId - Universe ID
 * @param {string} format - File format (mp3, wav)
 * @returns {Promise<Blob>} - Audio file blob
 */
export const downloadAudio = (universeId, format) => {
  return audioService.downloadMusic(universeId, format);
};

/**
 * Get all audio tracks for a universe
 * @param {number|string} universeId - Universe ID
 * @returns {Promise<object>} - List of audio tracks
 */
export const getAudioTracks = (universeId) => {
  return audioService.getAudioTracks(universeId);
};

/**
 * Update existing audio track
 * @param {number|string} universeId - Universe ID
 * @param {number|string} audioId - Audio ID
 * @param {object} audioData - Updated audio data
 * @returns {Promise<object>} - Updated audio track
 */
export const updateAudio = (universeId, audioId, audioData) => {
  return audioService.updateAudioTrack(universeId, audioId, audioData);
};

export default {
  getAudio,
  deleteAudio,
  generateAudio,
  saveAudio,
  downloadAudio,
  getAudioTracks,
  updateAudio
}; 