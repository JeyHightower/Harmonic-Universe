/**
 * Character Service
 * Handles operations related to characters in the application
 */

import { httpClient } from './http-client';
import { characterEndpoints } from './endpoints';
import { responseHandler } from './response-handler';

/**
 * Get all characters
 * @returns {Promise<object>} - List of all characters
 */
export const getAllCharacters = async () => {
  try {
    const response = await httpClient.get(characterEndpoints.list);
    return responseHandler.handleSuccess(response);
  } catch (error) {
    console.log('characters', 'Error fetching all characters', { error: error.message });
    return responseHandler.handleError(error);
  }
};

/**
 * Get characters for a specific universe
 * @param {number|string} universeId - Universe ID
 * @returns {Promise<object>} - List of characters for the universe
 */
export const getCharactersByUniverse = async (universeId) => {
  try {
    if (!universeId) {
      return responseHandler.handleError(new Error('Universe ID is required'));
    }

    const response = await httpClient.get(characterEndpoints.forUniverse(universeId));
    return responseHandler.handleSuccess(response);
  } catch (error) {
    console.log('characters', 'Error fetching universe characters', { 
      universeId, 
      error: error.message 
    });
    return responseHandler.handleError(error);
  }
};

/**
 * Get characters for a specific scene
 * @param {number|string} sceneId - Scene ID
 * @returns {Promise<object>} - List of characters for the scene
 */
export const getCharactersByScene = async (sceneId) => {
  try {
    if (!sceneId) {
      return responseHandler.handleError(new Error('Scene ID is required'));
    }

    const response = await httpClient.get(characterEndpoints.forScene(sceneId));
    return responseHandler.handleSuccess(response);
  } catch (error) {
    console.log('characters', 'Error fetching scene characters', { 
      sceneId, 
      error: error.message 
    });
    return responseHandler.handleError(error);
  }
};

/**
 * Get a specific character by ID
 * @param {number|string} characterId - Character ID
 * @returns {Promise<object>} - Character details
 */
export const getCharacterById = async (characterId) => {
  try {
    if (!characterId) {
      return responseHandler.handleError(new Error('Character ID is required'));
    }

    const response = await httpClient.get(characterEndpoints.get(characterId));
    return responseHandler.handleSuccess(response);
  } catch (error) {
    console.log('characters', 'Error fetching character by ID', { 
      characterId, 
      error: error.message 
    });
    return responseHandler.handleError(error);
  }
};

/**
 * Create a new character
 * @param {object} characterData - Character data to create
 * @returns {Promise<object>} - Created character
 */
export const createCharacter = async (characterData) => {
  try {
    // Validate required fields
    if (!characterData) {
      return responseHandler.handleError(new Error('Character data is required'));
    }
    
    if (!characterData.universeId) {
      return responseHandler.handleError(new Error('Universe ID is required for character creation'));
    }

    const response = await httpClient.post(characterEndpoints.create, characterData);
    
    console.log('characters', 'Character created successfully');
    return responseHandler.handleSuccess(response);
  } catch (error) {
    console.log('characters', 'Error creating character', { error: error.message });
    return responseHandler.handleError(error);
  }
};

/**
 * Update an existing character
 * @param {number|string} characterId - Character ID to update
 * @param {object} characterData - Updated character data
 * @returns {Promise<object>} - Updated character
 */
export const updateCharacter = async (characterId, characterData) => {
  try {
    if (!characterId) {
      return responseHandler.handleError(new Error('Character ID is required'));
    }
    
    if (!characterData) {
      return responseHandler.handleError(new Error('Character data is required'));
    }

    const response = await httpClient.put(characterEndpoints.update(characterId), characterData);
    
    console.log('characters', 'Character updated successfully', { characterId });
    return responseHandler.handleSuccess(response);
  } catch (error) {
    console.log('characters', 'Error updating character', { 
      characterId, 
      error: error.message 
    });
    return responseHandler.handleError(error);
  }
};

/**
 * Delete a character
 * @param {number|string} characterId - Character ID to delete
 * @returns {Promise<object>} - Deletion response
 */
export const deleteCharacter = async (characterId) => {
  try {
    if (!characterId) {
      return responseHandler.handleError(new Error('Character ID is required'));
    }

    const response = await httpClient.delete(characterEndpoints.delete(characterId));
    
    console.log('characters', 'Character deleted successfully', { characterId });
    return responseHandler.handleSuccess(response);
  } catch (error) {
    console.log('characters', 'Error deleting character', { 
      characterId, 
      error: error.message 
    });
    return responseHandler.handleError(error);
  }
};

/**
 * Get relationships for a character
 * @param {number|string} characterId - Character ID
 * @returns {Promise<object>} - Character relationships
 */
export const getCharacterRelationships = async (characterId) => {
  try {
    if (!characterId) {
      return responseHandler.handleError(new Error('Character ID is required'));
    }

    const response = await httpClient.get(characterEndpoints.relationships(characterId));
    return responseHandler.handleSuccess(response);
  } catch (error) {
    console.log('characters', 'Error fetching character relationships', { 
      characterId, 
      error: error.message 
    });
    return responseHandler.handleError(error);
  }
};

/**
 * Add or update a character's attributes
 * @param {number|string} characterId - Character ID
 * @param {object} attributes - Character attributes to update
 * @returns {Promise<object>} - Updated character attributes
 */
export const updateCharacterAttributes = async (characterId, attributes) => {
  try {
    if (!characterId) {
      return responseHandler.handleError(new Error('Character ID is required'));
    }
    
    if (!attributes || Object.keys(attributes).length === 0) {
      return responseHandler.handleError(new Error('Attributes are required'));
    }

    const response = await httpClient.patch(characterEndpoints.attributes(characterId), { attributes });
    
    console.log('characters', 'Character attributes updated successfully', { characterId });
    return responseHandler.handleSuccess(response);
  } catch (error) {
    console.log('characters', 'Error updating character attributes', { 
      characterId, 
      error: error.message 
    });
    return responseHandler.handleError(error);
  }
};

/**
 * Character service object
 */
export const characterService = {
  getAllCharacters,
  getCharactersByUniverse,
  getCharactersByScene,
  getCharacterById,
  createCharacter,
  updateCharacter,
  deleteCharacter,
  getCharacterRelationships,
  updateCharacterAttributes
};

export default characterService;
