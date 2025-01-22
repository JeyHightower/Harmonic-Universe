import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { universeService } from '../../services/universeService';

// Async thunks
export const fetchUniverse = createAsyncThunk(
  'universe/fetchUniverse',
  async id => {
    const response = await universeService.getUniverse(id);
    return response;
  }
);

export const createUniverse = createAsyncThunk(
  'universe/createUniverse',
  async universeData => {
    const response = await universeService.createUniverse(universeData);
    return response;
  }
);

export const updateUniverse = createAsyncThunk(
  'universe/updateUniverse',
  async ({ id, data }) => {
    const response = await universeService.updateUniverse(id, data);
    return response;
  }
);

export const deleteUniverse = createAsyncThunk(
  'universe/deleteUniverse',
  async id => {
    await universeService.deleteUniverse(id);
    return id;
  }
);

const universeSlice = createSlice({
  name: 'universe',
  initialState: {
    currentUniverse: null,
    universes: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      // Fetch universe
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
        state.error = action.error.message;
      })
      // Create universe
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
        state.error = action.error.message;
      })
      // Update universe
      .addCase(updateUniverse.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUniverse.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUniverse = action.payload;
        const index = state.universes.findIndex(
          u => u.id === action.payload.id
        );
        if (index !== -1) {
          state.universes[index] = action.payload;
        }
      })
      .addCase(updateUniverse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
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
        state.error = action.error.message;
      });
  },
});

export const { clearError } = universeSlice.actions;
export default universeSlice.reducer;
