import { api } from '../../utils/api';
import {
  setCharacters,
  setCurrentCharacter,
  addCharacter,
  updateCharacter,
  deleteCharacter,
  setLoading,
  setError,
} from '../slices/characterSlice';

// Fetch all characters for a scene
export const fetchCharacters = (sceneId) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const response = await api.get(`/characters/scene/${sceneId}`);
    dispatch(setCharacters(response.data.characters));
  } catch (error) {
    dispatch(setError(error.response?.data?.message || 'Error fetching characters'));
  } finally {
    dispatch(setLoading(false));
  }
};

// Fetch a single character
export const fetchCharacter = (characterId) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const response = await api.get(`/characters/${characterId}`);
    dispatch(setCurrentCharacter(response.data.character));
  } catch (error) {
    dispatch(setError(error.response?.data?.message || 'Error fetching character'));
  } finally {
    dispatch(setLoading(false));
  }
};

// Create a new character
export const createCharacter = (characterData) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const response = await api.post('/characters', characterData);
    dispatch(addCharacter(response.data.character));
    return response.data.character;
  } catch (error) {
    dispatch(setError(error.response?.data?.message || 'Error creating character'));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

// Update a character
export const updateCharacterById = (characterId, characterData) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const response = await api.put(`/characters/${characterId}`, characterData);
    dispatch(updateCharacter(response.data.character));
    return response.data.character;
  } catch (error) {
    dispatch(setError(error.response?.data?.message || 'Error updating character'));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

// Delete a character
export const deleteCharacterById = (characterId) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    await api.delete(`/characters/${characterId}`);
    dispatch(deleteCharacter(characterId));
  } catch (error) {
    dispatch(setError(error.response?.data?.message || 'Error deleting character'));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
}; 