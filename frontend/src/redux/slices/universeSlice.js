// redux/slices/universeSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { universeService } from '../../services/universeService';

// Async Thunks
export const fetchUniverses = createAsyncThunk(
  'universe/fetchUniverses',
  async (_, { rejectWithValue }) => {
    try {
      const data = await universeService.getAllUniverses();
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch universes');
    }
  }
);

export const fetchUniverseById = createAsyncThunk(
  'universe/fetchUniverseById',
  async (id, { rejectWithValue }) => {
    try {
      const data = await universeService.getUniverseById(id);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch universe');
    }
  }
);

export const createUniverse = createAsyncThunk(
  'universe/createUniverse',
  async (universeData, { rejectWithValue }) => {
    try {
      const data = await universeService.createUniverse(universeData);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create universe');
    }
  }
);

export const updateUniverse = createAsyncThunk(
  'universe/updateUniverse',
  async ({ id, universeData }, { rejectWithValue }) => {
    try {
      const data = await universeService.updateUniverse(id, universeData);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update universe');
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
      return rejectWithValue(error.response?.data?.message || 'Failed to delete universe');
    }
  }
);

const initialState = {
  universes: [],
  currentUniverse: null,
  isLoading: false,
  error: null,
};

const universeSlice = createSlice({
  name: 'universe',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch All Universes
      .addCase(fetchUniverses.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUniverses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.universes = action.payload;
        state.error = null;
      })
      .addCase(fetchUniverses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch Single Universe
      .addCase(fetchUniverseById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUniverseById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentUniverse = action.payload;
        state.error = null;
      })
      .addCase(fetchUniverseById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Create Universe
      .addCase(createUniverse.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createUniverse.fulfilled, (state, action) => {
        state.isLoading = false;
        state.universes.push(action.payload);
        state.error = null;
      })
      .addCase(createUniverse.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update Universe
      .addCase(updateUniverse.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUniverse.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.universes.findIndex(u => u.id === action.payload.id);
        if (index !== -1) {
          state.universes[index] = action.payload;
        }
        state.currentUniverse = action.payload;
        state.error = null;
      })
      .addCase(updateUniverse.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Delete Universe
      .addCase(deleteUniverse.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteUniverse.fulfilled, (state, action) => {
        state.isLoading = false;
        state.universes = state.universes.filter(u => u.id !== action.payload);
        if (state.currentUniverse?.id === action.payload) {
          state.currentUniverse = null;
        }
        state.error = null;
      })
      .addCase(deleteUniverse.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = universeSlice.actions;
export default universeSlice.reducer;
