import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { universeService } from '../../services/universeService';

const initialState = {
  universes: [],
  currentUniverse: null,
  loading: false,
  error: null,
  simulationStatus: 'stopped',
  lastTriggeredBy: null,
  activeUsers: [],
  parameters: {
    physics: {},
    music: {},
    visual: {},
  },
};

export const fetchUniverses = createAsyncThunk(
  'universe/fetchUniverses',
  async (_, { rejectWithValue }) => {
    try {
      return await universeService.getUniverses();
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to fetch universes'
      );
    }
  }
);

export const fetchUniverse = createAsyncThunk(
  'universe/fetchUniverse',
  async (id, { rejectWithValue }) => {
    try {
      return await universeService.getUniverse(id);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to fetch universe'
      );
    }
  }
);

export const createUniverse = createAsyncThunk(
  'universe/createUniverse',
  async (data, { rejectWithValue }) => {
    try {
      return await universeService.createUniverse(data);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to create universe'
      );
    }
  }
);

export const updateUniverse = createAsyncThunk(
  'universe/updateUniverse',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await universeService.updateUniverse(id, data);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to update universe'
      );
    }
  }
);

export const deleteUniverse = createAsyncThunk(
  'universe/deleteUniverse',
  async (id, { rejectWithValue }) => {
    try {
      await universeService.deleteUniverse(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to delete universe'
      );
    }
  }
);

export const updateParameters = createAsyncThunk(
  'universe/updateParameters',
  async ({ id, type, parameters }, { rejectWithValue }) => {
    try {
      return await universeService.updateParameters(id, type, parameters);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to update parameters'
      );
    }
  }
);

export const exportUniverse = createAsyncThunk(
  'universe/exportUniverse',
  async ({ id, format }) => {
    const response = await universeService.exportUniverse(id, format);
    return response.data;
  }
);

const universeSlice = createSlice({
  name: 'universe',
  initialState,
  reducers: {
    setSimulationStatus: (state, action) => {
      state.simulationStatus = action.payload.status;
      state.lastTriggeredBy = action.payload.triggeredBy;
    },
    updateUniverseParameters: (state, action) => {
      const { universe_id, type, parameters } = action.payload;
      if (state.currentUniverse?.id === universe_id) {
        state.currentUniverse.parameters[type] = parameters;
      }
    },
    setActiveUsers: (state, action) => {
      state.activeUsers = action.payload;
    },
    addActiveUser: (state, action) => {
      if (!state.activeUsers.find(user => user.id === action.payload.id)) {
        state.activeUsers.push(action.payload);
      }
    },
    removeActiveUser: (state, action) => {
      state.activeUsers = state.activeUsers.filter(
        user => user.id !== action.payload.id
      );
    },
    addCollaborator: (state, action) => {
      const { universe_id, user } = action.payload;
      if (state.currentUniverse?.id === universe_id) {
        state.currentUniverse.collaborators.push(user);
      }
    },
    removeCollaborator: (state, action) => {
      const { universe_id, user_id } = action.payload;
      if (state.currentUniverse?.id === universe_id) {
        state.currentUniverse.collaborators =
          state.currentUniverse.collaborators.filter(c => c.id !== user_id);
      }
    },
    clearError: state => {
      state.error = null;
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
        state.error = action.payload;
      })
      .addCase(fetchUniverse.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUniverse.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUniverse = action.payload;
        state.parameters = {
          physics: action.payload.physics_params || {},
          music: action.payload.music_params || {},
          visual: action.payload.visual_params || {},
        };
      })
      .addCase(fetchUniverse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createUniverse.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUniverse.fulfilled, (state, action) => {
        state.loading = false;
        state.universes.push(action.payload);
      })
      .addCase(createUniverse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateUniverse.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUniverse.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentUniverse?.id === action.payload.id) {
          state.currentUniverse = action.payload;
        }
        const index = state.universes.findIndex(
          u => u.id === action.payload.id
        );
        if (index !== -1) {
          state.universes[index] = action.payload;
        }
      })
      .addCase(updateUniverse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
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
        state.error = action.payload;
      })
      .addCase(updateParameters.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateParameters.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentUniverse) {
          state.currentUniverse.parameters = action.payload;
        }
      })
      .addCase(updateParameters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(exportUniverse.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(exportUniverse.fulfilled, state => {
        state.loading = false;
      })
      .addCase(exportUniverse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const {
  setSimulationStatus,
  updateUniverseParameters,
  setActiveUsers,
  addActiveUser,
  removeActiveUser,
  addCollaborator,
  removeCollaborator,
  clearError,
} = universeSlice.actions;

export default universeSlice.reducer;
