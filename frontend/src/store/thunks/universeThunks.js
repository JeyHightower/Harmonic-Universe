import { api } from '../../utils/api';
import {
  createUniverseFailure,
  createUniverseStart,
  createUniverseSuccess,
  deleteUniverseFailure,
  deleteUniverseStart,
  deleteUniverseSuccess,
  fetchUniversesFailure,
  fetchUniversesStart,
  fetchUniversesSuccess,
  updateUniverseFailure,
  updateUniverseStart,
  updateUniverseSuccess,
} from '../slices/universeSlice';

// Fetch all universes
export const fetchUniverses = () => async dispatch => {
  try {
    dispatch(fetchUniversesStart());
    const response = await api.get('/universes/');
    dispatch(fetchUniversesSuccess(response.data));
  } catch (error) {
    dispatch(fetchUniversesFailure(error.message));
  }
};

// Create a new universe
export const createUniverse = universeData => async dispatch => {
  try {
    dispatch(createUniverseStart());
    const response = await api.post('/universes/', universeData);
    dispatch(createUniverseSuccess(response.data));
    return response.data;
  } catch (error) {
    dispatch(createUniverseFailure(error.message));
    throw error;
  }
};

// Update an existing universe
export const updateUniverse = (universeId, universeData) => async dispatch => {
  try {
    dispatch(updateUniverseStart());
    const response = await api.put(`/universes/${universeId}/`, universeData);
    dispatch(updateUniverseSuccess(response.data));
    return response.data;
  } catch (error) {
    dispatch(updateUniverseFailure(error.message));
    throw error;
  }
};

// Delete a universe
export const deleteUniverse = universeId => async dispatch => {
  try {
    dispatch(deleteUniverseStart());
    await api.delete(`/universes/${universeId}/`);
    dispatch(deleteUniverseSuccess(universeId));
  } catch (error) {
    dispatch(deleteUniverseFailure(error.message));
    throw error;
  }
};
