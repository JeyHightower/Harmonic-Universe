// redux/slices/universeSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { exportService } from '../../services/exportService';
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

export const updateUniverse = createAsyncThunk(
  'universe/updateUniverse',
  async ({ id, universeData }, { rejectWithValue }) => {
    try {
      const data = await universeService.updateUniverse(id, universeData);
      return data;
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

export const exportUniverse = createAsyncThunk(
  'universe/exportUniverse',
  async (universeId, { rejectWithValue }) => {
    try {
      await exportService.exportUniverse(universeId);
      return true;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Export failed');
    }
  }
);

export const importUniverse = createAsyncThunk(
  'universe/importUniverse',
  async (file, { rejectWithValue }) => {
    try {
      const data = await exportService.importUniverse(file);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Import failed');
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
      return rejectWithValue(error.response?.data || error.message);
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
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const unshareUniverse = createAsyncThunk(
  'universe/unshareUniverse',
  async ({ universeId, userId }, { rejectWithValue }) => {
    try {
      await universeService.unshareUniverse(universeId, userId);
      return { userId };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  universes: [],
  currentUniverse: null,
  isLoading: false,
  error: null,
  exportStatus: 'idle', // 'idle' | 'loading' | 'success' | 'failed'
  importStatus: 'idle', // 'idle' | 'loading' | 'success' | 'failed'
};

const universeSlice = createSlice({
  name: 'universe',
  initialState,
  reducers: {
    clearError: state => {
      state.error = null;
    },
    resetExportStatus: state => {
      state.exportStatus = 'idle';
    },
    resetImportStatus: state => {
      state.importStatus = 'idle';
    },
  },
  extraReducers: builder => {
    builder
      // Fetch All Universes
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
      // Fetch Single Universe
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
      // Update Universe
      .addCase(updateUniverse.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUniverse.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.universes.findIndex(
          u => u.id === action.payload.id
        );
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
      .addCase(deleteUniverse.pending, state => {
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
      })
      // Export Universe
      .addCase(exportUniverse.pending, state => {
        state.exportStatus = 'loading';
        state.error = null;
      })
      .addCase(exportUniverse.fulfilled, state => {
        state.exportStatus = 'success';
      })
      .addCase(exportUniverse.rejected, (state, action) => {
        state.exportStatus = 'failed';
        state.error = action.payload;
      })
      // Import Universe
      .addCase(importUniverse.pending, state => {
        state.importStatus = 'loading';
        state.error = null;
      })
      .addCase(importUniverse.fulfilled, (state, action) => {
        state.importStatus = 'success';
        state.universes.push(action.payload);
      })
      .addCase(importUniverse.rejected, (state, action) => {
        state.importStatus = 'failed';
        state.error = action.payload;
      })
      // Update Universe Privacy
      .addCase(updateUniversePrivacy.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUniversePrivacy.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.currentUniverse) {
          state.currentUniverse.is_public = action.payload.is_public;
        }
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
        if (state.currentUniverse) {
          state.currentUniverse.shared_with = action.payload.shared_with;
        }
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
        if (state.currentUniverse) {
          state.currentUniverse.shared_with =
            state.currentUniverse.shared_with.filter(
              id => id !== action.payload.userId
            );
        }
      })
      .addCase(unshareUniverse.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, resetExportStatus, resetImportStatus } =
  universeSlice.actions;
export default universeSlice.reducer;
