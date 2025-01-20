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
  'universe/create',
  async (universeData, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/universes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(universeData),
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error);
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue({ message: error.message });
    }
  }
);

export const fetchUniverse = createAsyncThunk(
  'universe/fetch',
  async (universeId, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/universes/${universeId}`);

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error);
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue({ message: error.message });
    }
  }
);

export const updateUniverse = createAsyncThunk(
  'universe/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/universes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error);
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue({ message: error.message });
    }
  }
);

export const deleteUniverse = createAsyncThunk(
  'universe/delete',
  async (universeId, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/universes/${universeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error);
      }

      return universeId;
    } catch (error) {
      return rejectWithValue({ message: error.message });
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
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

const universeSlice = createSlice({
  name: 'universe',
  initialState,
  reducers: {
    resetStatus: state => {
      state.status = 'idle';
      state.error = null;
    },
    clearCurrentUniverse: state => {
      state.currentUniverse = null;
    },
  },
  extraReducers: builder => {
    builder
      // Fetch Universes
      .addCase(fetchUniverses.pending, state => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchUniverses.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.universes = action.payload;
        state.error = null;
      })
      .addCase(fetchUniverses.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Fetch Universe by ID
      .addCase(fetchUniverseById.pending, state => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchUniverseById.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentUniverse = action.payload;
        state.error = null;
      })
      .addCase(fetchUniverseById.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Create Universe
      .addCase(createUniverse.pending, state => {
        state.status = 'loading';
      })
      .addCase(createUniverse.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.universes.push(action.payload);
        state.currentUniverse = action.payload;
      })
      .addCase(createUniverse.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Fetch Universe
      .addCase(fetchUniverse.pending, state => {
        state.status = 'loading';
      })
      .addCase(fetchUniverse.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentUniverse = action.payload;
      })
      .addCase(fetchUniverse.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Update Universe
      .addCase(updateUniverse.pending, state => {
        state.status = 'loading';
      })
      .addCase(updateUniverse.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const index = state.universes.findIndex(
          u => u.id === action.payload.id
        );
        if (index !== -1) {
          state.universes[index] = action.payload;
        }
        state.currentUniverse = action.payload;
      })
      .addCase(updateUniverse.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Delete Universe
      .addCase(deleteUniverse.pending, state => {
        state.status = 'loading';
      })
      .addCase(deleteUniverse.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.universes = state.universes.filter(u => u.id !== action.payload);
        if (state.currentUniverse?.id === action.payload) {
          state.currentUniverse = null;
        }
      })
      .addCase(deleteUniverse.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Update Universe Privacy
      .addCase(updateUniversePrivacy.pending, state => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(updateUniversePrivacy.fulfilled, (state, action) => {
        state.status = 'succeeded';
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
        state.status = 'failed';
        state.error = action.payload;
      })
      // Share Universe
      .addCase(shareUniverse.pending, state => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(shareUniverse.fulfilled, (state, action) => {
        state.status = 'succeeded';
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
        state.status = 'failed';
        state.error = action.payload;
      })
      // Unshare Universe
      .addCase(unshareUniverse.pending, state => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(unshareUniverse.fulfilled, (state, action) => {
        state.status = 'succeeded';
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
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export const { resetStatus, clearCurrentUniverse } = universeSlice.actions;

// Selectors
export const selectCurrentUniverse = state => state.universe.currentUniverse;
export const selectAllUniverses = state => state.universe.universes;
export const selectUniverseStatus = state => state.universe.status;
export const selectUniverseError = state => state.universe.error;

export default universeSlice.reducer;
