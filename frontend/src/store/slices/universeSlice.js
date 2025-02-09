import api from '@/services/api';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

/**
 * @typedef {Object} Universe
 * @property {number} id
 * @property {string} name
 * @property {string} description
 * @property {Object} settings
 * @property {Object} harmony
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {number} userId
 */

/**
 * @typedef {Object} UniverseState
 * @property {Universe|null} currentUniverse
 * @property {boolean} loading
 * @property {string|null} error
 */

const initialState = {
  universes: [],
  currentUniverse: null,
  loading: false,
  error: null,
  realtimeStatus: {
    connected: false,
    lastSync: '',
    activeCollaborators: [],
  },
};

// Thunks
export const fetchUniverses = createAsyncThunk(
  'universe/fetchUniverses',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      if (!auth.isAuthenticated) {
        return rejectWithValue('Please log in to continue');
      }
      const response = await api.get('/api/universes/');
      return response.data;
    } catch (err) {
      console.error('Fetch Universes Error:', err);
      return rejectWithValue(err.message || 'Failed to fetch universes');
    }
  }
);

export const fetchUniverse = createAsyncThunk('universe/fetchUniverse', async universeId => {
  const response = await api.get(`/api/universes/${universeId}`);
  return response.data;
});

export const createUniverse = createAsyncThunk(
  'universe/create',
  async (data, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      if (!auth.isAuthenticated) {
        return rejectWithValue('Please log in to continue');
      }

      // Validate required fields
      if (!data.name?.trim()) {
        return rejectWithValue('Name is required');
      }
      if (data.name.trim().length > 255) {
        return rejectWithValue('Name must be less than 255 characters');
      }
      if (data.description?.trim()?.length > 1000) {
        return rejectWithValue('Description must be less than 1000 characters');
      }

      // Format data according to backend schema
      const universeData = {
        name: data.name.trim(),
        description: data.description?.trim() || '',
        is_public: Boolean(data.isPublic),
        physics_parameters: {
          gravity: {
            value: 9.81,
            enabled: true,
            unit: 'm/s²',
            min: 0,
            max: 100,
          },
          friction: {
            value: 0.2,
            enabled: true,
            unit: 'coefficient',
            min: 0,
            max: 1,
          },
          collision_elasticity: {
            value: 0.8,
            enabled: true,
            unit: 'coefficient',
            min: 0,
            max: 1,
          },
          air_resistance: {
            value: 0.1,
            enabled: true,
            unit: 'coefficient',
            min: 0,
            max: 1,
          },
        },
        harmony_parameters: {
          resonance: {
            value: 1.0,
            enabled: true,
            unit: 'factor',
            min: 0,
            max: 10,
          },
          dissonance: {
            value: 0.2,
            enabled: true,
            unit: 'factor',
            min: 0,
            max: 1,
          },
          harmony_scale: {
            value: 1.5,
            enabled: true,
            unit: 'factor',
            min: 0.1,
            max: 10,
          },
          balance: {
            value: 0.6,
            enabled: true,
            unit: 'factor',
            min: 0,
            max: 1,
          },
        },
      };

      console.log('Sending universe data to API:', universeData);

      const response = await api.post('/api/universes/', universeData);
      return response.data;
    } catch (err) {
      console.error('Create Universe Error:', err);

      // Handle specific error cases
      if (err.response?.status === 401) {
        return rejectWithValue('Please log in to continue');
      }
      if (err.response?.data?.error) {
        return rejectWithValue(err.response.data.error);
      }
      if (err.response?.data?.detail) {
        return rejectWithValue(err.response.data.detail);
      }

      return rejectWithValue(err.message || 'Failed to create universe');
    }
  }
);

export const updateUniverse = createAsyncThunk(
  'universe/updateUniverse',
  async ({ universeId, updates }) => {
    const response = await api.put(`/api/universes/${universeId}`, updates);
    return response.data;
  }
);

export const deleteUniverse = createAsyncThunk('universe/deleteUniverse', async universeId => {
  await api.delete(`/api/universes/${universeId}`);
  return universeId;
});

export const exportUniverse = createAsyncThunk(
  'universe/exportUniverse',
  async ({ universeId, format }) => {
    const response = await api.get(`/api/universes/${universeId}/export?format=${format}`);
    return response.data;
  }
);

export const generateWithAI = createAsyncThunk(
  'universe/generateWithAI',
  async ({ universeId, prompt, type }) => {
    const response = await api.post(`/api/universes/${universeId}/generate`, { prompt, type });
    return response.data;
  }
);

export const updateHarmonyParameters = createAsyncThunk(
  'universe/updateHarmonyParameters',
  async ({ universeId, parameters }) => {
    const response = await api.put(`/api/universes/${universeId}/harmony`, parameters);
    return response.data;
  }
);

export const updatePhysics = createAsyncThunk(
  'universe/updatePhysics',
  async ({ universeId, parameters }) => {
    const response = await api.put(`/api/universes/${universeId}/physics`, parameters);
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
    updatePhysicsParams: (state, action) => {
      const universe = state.universes.find(u => u.id === action.payload.universeId);
      if (universe) {
        universe.physicsParams = { ...universe.physicsParams, ...action.payload.params };
      }
      if (state.currentUniverse?.id === action.payload.universeId) {
        state.currentUniverse.physicsParams = {
          ...state.currentUniverse.physicsParams,
          ...action.payload.params,
        };
      }
    },
    updateHarmonyParams: (state, action) => {
      const universe = state.universes.find(u => u.id === action.payload.universeId);
      if (universe) {
        universe.harmonyParams = { ...universe.harmonyParams, ...action.payload.params };
      }
      if (state.currentUniverse?.id === action.payload.universeId) {
        state.currentUniverse.harmonyParams = {
          ...state.currentUniverse.harmonyParams,
          ...action.payload.params,
        };
      }
    },
    addStoryPoint: (state, action) => {
      const universe = state.universes.find(u => u.id === action.payload.universeId);
      if (universe) {
        const newId = Math.max(0, ...universe.storyPoints.map(p => p.id)) + 1;
        universe.storyPoints.push({ ...action.payload.storyPoint, id: newId });
      }
    },
    updateStoryPoint: (state, action) => {
      const universe = state.universes.find(u => u.id === action.payload.universeId);
      if (universe) {
        const pointIndex = universe.storyPoints.findIndex(
          p => p.id === action.payload.storyPointId
        );
        if (pointIndex !== -1) {
          universe.storyPoints[pointIndex] = {
            ...universe.storyPoints[pointIndex],
            ...action.payload.updates,
          };
        }
      }
    },
    deleteStoryPoint: (state, action) => {
      const universe = state.universes.find(u => u.id === action.payload.universeId);
      if (universe) {
        universe.storyPoints = universe.storyPoints.filter(
          p => p.id !== action.payload.storyPointId
        );
      }
    },
    updateRealtimeStatus: (state, action) => {
      state.realtimeStatus = action.payload;
    },
    updateVisualizationParams: (state, action) => {
      const universe = state.universes.find(u => u.id === action.payload.universeId);
      if (universe) {
        universe.visualizationParams = {
          ...universe.visualizationParams,
          ...action.payload.params,
        };
      }
      if (state.currentUniverse?.id === action.payload.universeId) {
        state.currentUniverse.visualizationParams = {
          ...state.currentUniverse.visualizationParams,
          ...action.payload.params,
        };
      }
    },
    updateAIGenerationParams: (state, action) => {
      const universe = state.universes.find(u => u.id === action.payload.universeId);
      if (universe) {
        universe.harmonyParams.aiGenerationParams = {
          ...universe.harmonyParams.aiGenerationParams,
          ...action.payload.params,
        };
      }
      if (state.currentUniverse?.id === action.payload.universeId) {
        state.currentUniverse.harmonyParams.aiGenerationParams = {
          ...state.currentUniverse.harmonyParams.aiGenerationParams,
          ...action.payload.params,
        };
      }
    },
    updateHarmony: (state, action) => {
      if (state.currentUniverse) {
        state.currentUniverse.harmony = {
          ...state.currentUniverse.harmony,
          ...action.payload,
        };
      }
    },
  },
  extraReducers: builder => {
    builder
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
      .addCase(fetchUniverse.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUniverse.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUniverse = action.payload;
        const index = state.universes.findIndex(u => u.id === action.payload.id);
        if (index !== -1) {
          state.universes[index] = action.payload;
        } else {
          state.universes.push(action.payload);
        }
      })
      .addCase(fetchUniverse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch universe';
      })
      .addCase(createUniverse.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUniverse.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUniverse = action.payload;
      })
      .addCase(createUniverse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateUniverse.fulfilled, (state, action) => {
        const index = state.universes.findIndex(u => u.id === action.payload.id);
        if (index !== -1) {
          state.universes[index] = action.payload;
        }
        if (state.currentUniverse?.id === action.payload.id) {
          state.currentUniverse = action.payload;
        }
      })
      .addCase(deleteUniverse.fulfilled, (state, action) => {
        state.universes = state.universes.filter(u => u.id !== action.payload);
        if (state.currentUniverse?.id === action.payload) {
          state.currentUniverse = null;
        }
      })
      .addCase(generateWithAI.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateWithAI.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentUniverse) {
          switch (action.meta.arg.type) {
            case 'story':
              state.currentUniverse.storyPoints.push(action.payload);
              break;
            case 'harmony':
              state.currentUniverse.harmonyParams = {
                ...state.currentUniverse.harmonyParams,
                ...action.payload,
              };
              break;
            case 'physics':
              state.currentUniverse.physicsParams = {
                ...state.currentUniverse.physicsParams,
                ...action.payload,
              };
              break;
          }
        }
      })
      .addCase(generateWithAI.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'AI generation failed';
      })
      .addCase(updateHarmonyParameters.fulfilled, (state, action) => {
        if (state.currentUniverse) {
          state.currentUniverse.harmony = action.payload;
        }
      });
  },
});

export const {
  setCurrentUniverse,
  clearError,
  updatePhysicsParams,
  updateHarmonyParams,
  addStoryPoint,
  updateStoryPoint,
  deleteStoryPoint,
  updateRealtimeStatus,
  updateVisualizationParams,
  updateAIGenerationParams,
  updateHarmony,
} = universeSlice.actions;

// Selectors
export const selectUniverseState = state => state.universe;
export const selectUniverses = state => state.universe.universes;
export const selectCurrentUniverse = state => state.universe.currentUniverse;
export const selectUniverseLoading = state => state.universe.loading;
export const selectUniverseError = state => state.universe.error;
export const selectRealtimeStatus = state => state.universe.realtimeStatus;

export default universeSlice.reducer;
