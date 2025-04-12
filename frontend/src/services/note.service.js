/**
 * Note Service
 * Handles operations related to notes for universes, scenes, and characters
 */

import Logger from "../utils/logger";
import { httpClient } from './http-client';
import { noteEndpoints } from './endpoints';
import { responseHandler } from './response-handler';

/**
 * Get all notes
 * @returns {Promise<object>} - List of all notes
 */
export const getAllNotes = async () => {
  try {
    const response = await httpClient.get(noteEndpoints.list);
    return responseHandler.handleSuccess(response);
  } catch (error) {
    log('notes', 'Error fetching all notes', { error: error.message });
    return responseHandler.handleError(error);
  }
};

/**
 * Get notes for a specific universe
 * @param {number|string} universeId - Universe ID
 * @returns {Promise<object>} - List of notes for the universe
 */
export const getNotesByUniverse = async (universeId) => {
  try {
    if (!universeId) {
      return responseHandler.handleError(new Error('Universe ID is required'));
    }

    const response = await httpClient.get(noteEndpoints.forUniverse(universeId));
    return responseHandler.handleSuccess(response);
  } catch (error) {
    log('notes', 'Error fetching universe notes', { 
      universeId, 
      error: error.message 
    });
    return responseHandler.handleError(error);
  }
};

/**
 * Get notes for a specific scene
 * @param {number|string} sceneId - Scene ID
 * @returns {Promise<object>} - List of notes for the scene
 */
export const getNotesByScene = async (sceneId) => {
  try {
    if (!sceneId) {
      return responseHandler.handleError(new Error('Scene ID is required'));
    }

    const response = await httpClient.get(noteEndpoints.forScene(sceneId));
    return responseHandler.handleSuccess(response);
  } catch (error) {
    log('notes', 'Error fetching scene notes', { 
      sceneId, 
      error: error.message 
    });
    return responseHandler.handleError(error);
  }
};

/**
 * Get notes for a specific character
 * @param {number|string} characterId - Character ID
 * @returns {Promise<object>} - List of notes for the character
 */
export const getNotesByCharacter = async (characterId) => {
  try {
    if (!characterId) {
      return responseHandler.handleError(new Error('Character ID is required'));
    }

    const response = await httpClient.get(noteEndpoints.forCharacter(characterId));
    return responseHandler.handleSuccess(response);
  } catch (error) {
    log('notes', 'Error fetching character notes', { 
      characterId, 
      error: error.message 
    });
    return responseHandler.handleError(error);
  }
};

/**
 * Get a specific note by ID
 * @param {number|string} noteId - Note ID
 * @returns {Promise<object>} - Note details
 */
export const getNoteById = async (noteId) => {
  try {
    if (!noteId) {
      return responseHandler.handleError(new Error('Note ID is required'));
    }

    const response = await httpClient.get(noteEndpoints.get(noteId));
    return responseHandler.handleSuccess(response);
  } catch (error) {
    log('notes', 'Error fetching note by ID', { 
      noteId, 
      error: error.message 
    });
    return responseHandler.handleError(error);
  }
};

/**
 * Create a new note
 * @param {object} noteData - Note data to create
 * @returns {Promise<object>} - Created note
 */
export const createNote = async (noteData) => {
  try {
    // Validate required fields
    if (!noteData || !noteData.content) {
      return responseHandler.handleError(new Error('Note content is required'));
    }
    
    // At least one parent entity is required
    if (!noteData.universeId && !noteData.sceneId && !noteData.characterId) {
      return responseHandler.handleError(
        new Error('Note must be associated with a universe, scene, or character')
      );
    }

    const response = await httpClient.post(noteEndpoints.create, noteData);
    
    log('notes', 'Note created successfully');
    return responseHandler.handleSuccess(response);
  } catch (error) {
    log('notes', 'Error creating note', { error: error.message });
    return responseHandler.handleError(error);
  }
};

/**
 * Update an existing note
 * @param {number|string} noteId - Note ID to update
 * @param {object} noteData - Updated note data
 * @returns {Promise<object>} - Updated note
 */
export const updateNote = async (noteId, noteData) => {
  try {
    if (!noteId) {
      return responseHandler.handleError(new Error('Note ID is required'));
    }
    
    if (!noteData) {
      return responseHandler.handleError(new Error('Note data is required'));
    }

    const response = await httpClient.put(noteEndpoints.update(noteId), noteData);
    
    log('notes', 'Note updated successfully', { noteId });
    return responseHandler.handleSuccess(response);
  } catch (error) {
    log('notes', 'Error updating note', { 
      noteId, 
      error: error.message 
    });
    return responseHandler.handleError(error);
  }
};

/**
 * Delete a note
 * @param {number|string} noteId - Note ID to delete
 * @returns {Promise<object>} - Deletion response
 */
export const deleteNote = async (noteId) => {
  try {
    if (!noteId) {
      return responseHandler.handleError(new Error('Note ID is required'));
    }

    const response = await httpClient.delete(noteEndpoints.delete(noteId));
    
    log('notes', 'Note deleted successfully', { noteId });
    return responseHandler.handleSuccess(response);
  } catch (error) {
    log('notes', 'Error deleting note', { 
      noteId, 
      error: error.message 
    });
    return responseHandler.handleError(error);
  }
};

/**
 * Note service object
 */
export const noteService = {
  getAllNotes,
  getNotesByUniverse,
  getNotesByScene,
  getNotesByCharacter,
  getNoteById,
  createNote,
  updateNote,
  deleteNote
};

export default noteService;
