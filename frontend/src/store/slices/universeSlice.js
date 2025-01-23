import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { universeService } from '../../services/universeService';

const initialState = {
  currentUniverse: null,
  universeList: [],
  physicsEngine: null,
  loading: false,
  error: null,
  simulationStatus: 'stopped', // 'running', 'paused', 'stopped'
  simulationSpeed: 1,
  selectedObject: null,
};

export const fetchUniverses = createAsyncThunk(
  'universe/fetchUniverses',
  async (_, { rejectWithValue }) => {
    try {
      const response = await universeService.getAllUniverses();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch universes'
      );
    }
  }
);

export const createUniverse = createAsyncThunk(
  'universe/createUniverse',
  async (universeData, { rejectWithValue }) => {
    try {
      const response = await universeService.createUniverse(universeData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create universe'
      );
    }
  }
);

export const updateUniverse = createAsyncThunk(
  'universe/updateUniverse',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await universeService.updateUniverse(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update universe'
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
        error.response?.data?.message || 'Failed to delete universe'
      );
    }
  }
);

const universeSlice = createSlice({
  name: 'universe',
  initialState,
  reducers: {
    setPhysicsEngine: (state, action) => {
      state.physicsEngine = action.payload;
    },
    setSimulationStatus: (state, action) => {
      state.simulationStatus = action.payload;
    },
    setSimulationSpeed: (state, action) => {
      state.simulationSpeed = action.payload;
    },
    setSelectedObject: (state, action) => {
      state.selectedObject = action.payload;
    },
    updateObject: (state, action) => {
      if (state.currentUniverse && state.currentUniverse.objects) {
        const index = state.currentUniverse.objects.findIndex(
          obj => obj.id === action.payload.id
        );
        if (index !== -1) {
          state.currentUniverse.objects[index] = {
            ...state.currentUniverse.objects[index],
            ...action.payload,
          };
        }
      }
    },
    clearError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      // Fetch Universes
      .addCase(fetchUniverses.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUniverses.fulfilled, (state, action) => {
        state.loading = false;
        state.universeList = action.payload;
      })
      .addCase(fetchUniverses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Universe
      .addCase(createUniverse.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUniverse.fulfilled, (state, action) => {
        state.loading = false;
        state.universeList.push(action.payload);
        state.currentUniverse = action.payload;
      })
      .addCase(createUniverse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Universe
      .addCase(updateUniverse.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUniverse.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.universeList.findIndex(
          u => u.id === action.payload.id
        );
        if (index !== -1) {
          state.universeList[index] = action.payload;
        }
        if (state.currentUniverse?.id === action.payload.id) {
          state.currentUniverse = action.payload;
        }
      })
      .addCase(updateUniverse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete Universe
      .addCase(deleteUniverse.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUniverse.fulfilled, (state, action) => {
        state.loading = false;
        state.universeList = state.universeList.filter(
          u => u.id !== action.payload
        );
        if (state.currentUniverse?.id === action.payload) {
          state.currentUniverse = null;
        }
      })
      .addCase(deleteUniverse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setPhysicsEngine,
  setSimulationStatus,
  setSimulationSpeed,
  setSelectedObject,
  updateObject,
  clearError,
} = universeSlice.actions;

export const selectCurrentUniverse = state => state.universe.currentUniverse;
export const selectUniverseList = state => state.universe.universeList;
export const selectPhysicsEngine = state => state.universe.physicsEngine;
export const selectSimulationStatus = state => state.universe.simulationStatus;
export const selectSimulationSpeed = state => state.universe.simulationSpeed;
export const selectSelectedObject = state => state.universe.selectedObject;
export const selectUniverseLoading = state => state.universe.loading;
export const selectUniverseError = state => state.universe.error;

export default universeSlice.reducer;
