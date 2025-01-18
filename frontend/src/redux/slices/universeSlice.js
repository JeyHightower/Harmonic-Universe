// redux/slices/universeSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { universeService } from '../../services/universeService';

// Async Thunks
export const fetchUniverses = createAsyncThunk(
  'universe/fetchUniverses',
  async (_, { rejectWithValue }) => {
    try {
      const data = await universeService.getAllUniverses();
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch universes'
      );
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
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch universe'
      );
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
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create universe'
      );
    }
  }
);

export const updateUniversePrivacy = createAsyncThunk(
  'universe/updatePrivacy',
  async ({ universeId, isPublic }, { rejectWithValue }) => {
    try {
      const response = await universeService.updatePrivacy(
        universeId,
        isPublic
      );
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update privacy settings'
      );
    }
  }
);

export const shareUniverse = createAsyncThunk(
  'universe/shareUniverse',
  async ({ universeId, userId }, { rejectWithValue }) => {
    try {
      const response = await universeService.shareUniverse(universeId, userId);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to share universe'
      );
    }
  }
);

export const unshareUniverse = createAsyncThunk(
  'universe/unshareUniverse',
  async ({ universeId, userId }, { rejectWithValue }) => {
    try {
      const response = await universeService.unshareUniverse(
        universeId,
        userId
      );
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to unshare universe'
      );
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
    clearError: state => {
      state.error = null;
    },
    resetState: () => initialState,
  },
  extraReducers: builder => {
    builder
      // Fetch Universes
      .addCase(fetchUniverses.pending, state => {
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
      // Fetch Universe by ID
      .addCase(fetchUniverseById.pending, state => {
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
      .addCase(createUniverse.pending, state => {
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
      // Update Universe Privacy
      .addCase(updateUniversePrivacy.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUniversePrivacy.fulfilled, (state, action) => {
        state.isLoading = false;
        if (
          state.currentUniverse &&
          state.currentUniverse.id === action.payload.id
        ) {
          state.currentUniverse.is_public = action.payload.is_public;
        }
        const universeIndex = state.universes.findIndex(
          u => u.id === action.payload.id
        );
        if (universeIndex !== -1) {
          state.universes[universeIndex].is_public = action.payload.is_public;
        }
        state.error = null;
      })
      .addCase(updateUniversePrivacy.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Share Universe
      .addCase(shareUniverse.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(shareUniverse.fulfilled, (state, action) => {
        state.isLoading = false;
        if (
          state.currentUniverse &&
          state.currentUniverse.id === action.payload.id
        ) {
          state.currentUniverse.shared_with = action.payload.shared_with;
        }
        const universeIndex = state.universes.findIndex(
          u => u.id === action.payload.id
        );
        if (universeIndex !== -1) {
          state.universes[universeIndex].shared_with =
            action.payload.shared_with;
        }
        state.error = null;
      })
      .addCase(shareUniverse.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Unshare Universe
      .addCase(unshareUniverse.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(unshareUniverse.fulfilled, (state, action) => {
        state.isLoading = false;
        if (
          state.currentUniverse &&
          state.currentUniverse.id === action.payload.id
        ) {
          state.currentUniverse.shared_with = action.payload.shared_with;
        }
        const universeIndex = state.universes.findIndex(
          u => u.id === action.payload.id
        );
        if (universeIndex !== -1) {
          state.universes[universeIndex].shared_with =
            action.payload.shared_with;
        }
        state.error = null;
      })
      .addCase(unshareUniverse.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, resetState } = universeSlice.actions;
export default universeSlice.reducer;
