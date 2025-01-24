import { createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api';

export const createUniverse = createAsyncThunk(
  'universe/create',
  async universeData => {
    const response = await api.post('/api/universes', universeData);
    return response.data;
  }
);

export const fetchUniverse = createAsyncThunk(
  'universe/fetch',
  async universeId => {
    const response = await api.get(`/api/universes/${universeId}`);
    return response.data;
  }
);

export const updateUniverse = createAsyncThunk(
  'universe/update',
  async ({ id, data }) => {
    const response = await api.put(`/api/universes/${id}`, data);
    return response.data;
  }
);

export const deleteUniverse = createAsyncThunk(
  'universe/delete',
  async universeId => {
    await api.delete(`/api/universes/${universeId}`);
    return universeId;
  }
);
