import api from '@/services/api';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { RootState } from '../store';

export interface Universe {
  id: number;
  name: string;
  description: string;
  userId: number;
  isPublic: boolean;
  physicsParams: {
    gravity: number;
    friction: number;
    elasticity: number;
    airResistance: number;
    timeDilation: number;
  };
  harmonyParams: {
    baseFrequency: number;
    scale: string;
    tempo: number;
    volume: number;
  };
  storyPoints: Array<{
    id: number;
    content: string;
    timestamp: string;
    harmonyTie?: {
      frequency?: number;
      tempo?: number;
      scale?: string;
    };
  }>;
  createdAt: string;
  updatedAt: string;
}

interface UniverseState {
  universes: Universe[];
  currentUniverse: Universe | null;
  error: string | null;
  loading: boolean;
}

const initialState: UniverseState = {
  universes: [],
  currentUniverse: null,
  error: null,
  loading: false,
};

// Async thunks
export const fetchUniverses = createAsyncThunk('universe/fetchAll', async () => {
  const response = await api.get('/api/v1/universes');
  return response.data;
});

export const fetchUniverse = createAsyncThunk('universe/fetchOne', async (universeId: number) => {
  const response = await api.get(`/api/v1/universes/${universeId}`);
  return response.data;
});

export const createUniverse = createAsyncThunk(
  'universe/create',
  async (data: {
    name: string;
    description: string;
    isPublic: boolean;
    physicsParams?: Partial<Universe['physicsParams']>;
    harmonyParams?: Partial<Universe['harmonyParams']>;
  }) => {
    const response = await api.post('/api/v1/universes', data);
    return response.data;
  }
);

export const updateUniverse = createAsyncThunk(
  'universe/update',
  async ({ universeId, data }: { universeId: number; data: Partial<Universe> }) => {
    const response = await api.put(`/api/v1/universes/${universeId}`, data);
    return response.data;
  }
);

export const deleteUniverse = createAsyncThunk('universe/delete', async (universeId: number) => {
  await api.delete(`/api/v1/universes/${universeId}`);
  return universeId;
});

export const updatePhysics = createAsyncThunk(
  'universe/updatePhysics',
  async ({
    universeId,
    parameters,
  }: {
    universeId: number;
    parameters: Partial<Universe['physicsParams']>;
  }) => {
    const response = await api.put(`/api/v1/universes/${universeId}/physics`, parameters);
    return response.data;
  }
);

export const addStoryPoint = createAsyncThunk(
  'universe/addStoryPoint',
  async ({
    universeId,
    storyPoint,
  }: {
    universeId: number;
    storyPoint: Omit<Universe['storyPoints'][0], 'id' | 'timestamp'>;
  }) => {
    const response = await api.post(`/api/v1/universes/${universeId}/story`, storyPoint);
    return response.data;
  }
);

export const exportUniverse = createAsyncThunk(
  'universe/export',
  async ({ universeId, format }: { universeId: number; format: 'json' | 'audio' }) => {
    const response = await api.get(`/api/v1/universes/${universeId}/export?format=${format}`);
    return response.data;
  }
);

const universeSlice = createSlice({
  name: 'universe',
  initialState,
  reducers: {
    setCurrentUniverse: (state, action) => {
      state.currentUniverse = action.payload;
    },
    clearError: state => {
      state.error = null;
    },
    updatePhysicsLocally: (state, action) => {
      if (state.currentUniverse) {
        state.currentUniverse.physicsParams = {
          ...state.currentUniverse.physicsParams,
          ...action.payload,
        };
      }
    },
    updateHarmonyLocally: (state, action) => {
      if (state.currentUniverse) {
        state.currentUniverse.harmonyParams = {
          ...state.currentUniverse.harmonyParams,
          ...action.payload,
        };
      }
    },
  },
  extraReducers: builder => {
    builder
      // Fetch all universes
      .addCase(fetchUniverses.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUniverses.fulfilled, (state, action) => {
        state.loading = false;
        state.universes = action.payload;
      })
      .addCase(fetchUniverses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch universes';
      })
      // Fetch single universe
      .addCase(fetchUniverse.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUniverse.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUniverse = action.payload;
      })
      .addCase(fetchUniverse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch universe';
      })
      // Create universe
      .addCase(createUniverse.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUniverse.fulfilled, (state, action) => {
        state.loading = false;
        state.universes.push(action.payload);
        state.currentUniverse = action.payload;
      })
      .addCase(createUniverse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create universe';
      })
      // Update universe
      .addCase(updateUniverse.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUniverse.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.universes.findIndex(u => u.id === action.payload.id);
        if (index !== -1) {
          state.universes[index] = action.payload;
        }
        if (state.currentUniverse?.id === action.payload.id) {
          state.currentUniverse = action.payload;
        }
      })
      .addCase(updateUniverse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update universe';
      })
      // Delete universe
      .addCase(deleteUniverse.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUniverse.fulfilled, (state, action) => {
        state.loading = false;
        state.universes = state.universes.filter(u => u.id !== action.payload);
        if (state.currentUniverse?.id === action.payload) {
          state.currentUniverse = null;
        }
      })
      .addCase(deleteUniverse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete universe';
      })
      // Update physics
      .addCase(updatePhysics.fulfilled, (state, action) => {
        if (state.currentUniverse) {
          state.currentUniverse.physicsParams = action.payload.physics;
          state.currentUniverse.harmonyParams = action.payload.harmony;
        }
      })
      // Add story point
      .addCase(addStoryPoint.fulfilled, (state, action) => {
        if (state.currentUniverse) {
          state.currentUniverse = action.payload;
        }
      });
  },
});

export const { setCurrentUniverse, clearError, updatePhysicsLocally, updateHarmonyLocally } =
  universeSlice.actions;

export const selectUniverseState = (state: RootState) => state.universe;
export const selectUniverses = (state: RootState) => state.universe.universes;
export const selectCurrentUniverse = (state: RootState) => state.universe.currentUniverse;
export const selectUniverseError = (state: RootState) => state.universe.error;
export const selectUniverseLoading = (state: RootState) => state.universe.loading;

export default universeSlice.reducer;
