import { createSlice } from '@reduxjs/toolkit';
import {
  createUniverse,
  deleteUniverse,
  fetchUniverses,
  updateHarmonyParams,
  updatePhysicsParams,
  updateUniverse,
  fetchUniverseById,
} from '../thunks/universeThunks';

const initialState = {
  universes: [],
  loading: false,
  error: null,
  currentUniverse: null,
  lastFetched: null,
  authError: false,
  sortBy: 'updated_at',
  sortOrder: 'desc',
  success: false,
};

const universeSlice = createSlice({
  name: 'universe',
  initialState,
  reducers: {
    setCurrentUniverse: (state, action) => {
      state.currentUniverse = action.payload;
      if (state.universes.length > 0) {
        const index = state.universes.findIndex(
          u => u.id === action.payload.id
        );
        if (index !== -1) {
          state.universes[index] = action.payload;
        }
      }
    },
    clearError: state => {
      state.error = null;
      state.authError = false;
    },
    resetState: () => initialState,
    clearAuthError: state => {
      state.authError = false;
    },
    setSortBy: (state, action) => {
      state.sortBy = action.payload;
    },
    setSortOrder: (state, action) => {
      state.sortOrder = action.payload;
    },
    sortUniverses: state => {
      const sortBy = state.sortBy;
      const sortOrder = state.sortOrder;

      state.universes.sort((a, b) => {
        let comparison = 0;

        switch (sortBy) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'created_at':
            comparison = new Date(a.created_at) - new Date(b.created_at);
            break;
          case 'updated_at':
            comparison = new Date(a.updated_at) - new Date(b.updated_at);
            break;
          case 'is_public':
            comparison = a.is_public === b.is_public ? 0 : a.is_public ? -1 : 1;
            break;
          default:
            comparison = 0;
        }

        return sortOrder === 'desc' ? -comparison : comparison;
      });
    },
    clearUniverseError(state) {
      state.error = null;
    },
    clearUniverseSuccess(state) {
      state.success = false;
    },
    resetUniverseState(state) {
      return initialState;
    },
  },
  extraReducers: builder => {
    // Fetch universes
    builder
      .addCase(fetchUniverses.pending, state => {
        console.debug('Fetching universes...');
        state.loading = true;
        state.error = null;
        state.authError = false;
      })
      .addCase(fetchUniverses.fulfilled, (state, action) => {
        console.debug('Universes fetched successfully:', action.payload);
        state.loading = false;
        state.universes = action.payload.data.universes;
        state.lastFetched = Date.now();
        state.error = null;
        state.authError = false;
      })
      .addCase(fetchUniverses.rejected, (state, action) => {
        console.error('Failed to fetch universes:', action.payload);
        state.loading = false;
        state.error = action.payload || 'Failed to fetch universes';
        state.authError =
          action.payload?.status === 401 || action.payload?.status === 403;
        if (state.authError) {
          state.universes = [];
        }
      })

      // Fetch universe by ID
      .addCase(fetchUniverseById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUniverseById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUniverse = action.payload.data.universe;
      })
      .addCase(fetchUniverseById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch universe';
      })

      // Create universe
      .addCase(createUniverse.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createUniverse.fulfilled, (state, action) => {
        console.debug('Universe created:', action.payload);
        state.loading = false;
        state.success = true;
        state.universes = [...(state.universes || []), action.payload.data.universe];
        state.currentUniverse = action.payload.data.universe;
        state.error = null;
        state.authError = false;
      })
      .addCase(createUniverse.rejected, (state, action) => {
        console.error('Failed to create universe:', action.payload);
        state.loading = false;
        state.error = action.payload || 'Failed to create universe';
        state.success = false;
      })

      // Update universe
      .addCase(updateUniverse.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateUniverse.fulfilled, (state, action) => {
        console.debug('Universe updated:', action.payload);
        state.loading = false;
        state.success = true;
        const updatedUniverse = action.payload.data.universe;
        state.universes = state.universes.map(universe =>
          universe.id === updatedUniverse.id ? updatedUniverse : universe
        );
        if (state.currentUniverse?.id === updatedUniverse.id) {
          state.currentUniverse = updatedUniverse;
        }
        state.error = null;
        state.authError = false;
      })
      .addCase(updateUniverse.rejected, (state, action) => {
        console.error('Failed to update universe:', action.payload);
        state.loading = false;
        state.error = action.payload || 'Failed to update universe';
        state.success = false;
      })

      // Delete universe
      .addCase(deleteUniverse.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(deleteUniverse.fulfilled, (state, action) => {
        console.debug('Universe deleted successfully:', action.meta.arg);
        state.loading = false;
        state.success = true;
        const deletedId = action.meta.arg;
        state.universes = state.universes.filter((u) => u.id !== deletedId);
        if (state.currentUniverse?.id === deletedId) {
          state.currentUniverse = null;
        }
        state.error = null;
        state.authError = false;
      })
      .addCase(deleteUniverse.rejected, (state, action) => {
        console.error('Failed to delete universe:', action.payload);
        state.loading = false;
        state.error = action.payload || 'Failed to delete universe';
        state.success = false;
      })

      // Handle physics params update
      .addCase(updatePhysicsParams.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePhysicsParams.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;

        if (!action.payload || !action.payload.physics_params) {
          console.error('Invalid payload received:', action.payload);
          return;
        }

        const updatedUniverse = {
          ...action.payload,
          updated_at: new Date().toISOString(),
        };

        // Update current universe if it matches
        if (state.currentUniverse?.id === action.payload.id) {
          state.currentUniverse = updatedUniverse;
        }

        // Update in universes list if present
        state.universes = state.universes.map(universe =>
          universe.id === action.payload.id ? updatedUniverse : universe
        );

        // Log the update for debugging
        console.debug('Physics params updated in store:', {
          id: action.payload.id,
          params: action.payload.physics_params,
        });
      })
      .addCase(updatePhysicsParams.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update physics parameters';
        console.error('Physics update failed:', action.payload);
      })

      // Handle harmony params update
      .addCase(updateHarmonyParams.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateHarmonyParams.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;

        if (!action.payload || !action.payload.harmony_params) {
          console.error('Invalid payload received:', action.payload);
          return;
        }

        const updatedUniverse = {
          ...action.payload,
          updated_at: new Date().toISOString(),
        };

        // Update current universe if it matches
        if (state.currentUniverse?.id === action.payload.id) {
          state.currentUniverse = updatedUniverse;
        }

        // Update in universes list if present
        state.universes = state.universes.map(universe =>
          universe.id === action.payload.id ? updatedUniverse : universe
        );

        // Log the update for debugging
        console.debug('Harmony params updated in store:', {
          id: action.payload.id,
          params: action.payload.harmony_params,
        });
      })
      .addCase(updateHarmonyParams.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update harmony parameters';
        console.error('Harmony update failed:', action.payload);
      });
  },
});

export const {
  setCurrentUniverse,
  clearError,
  resetState,
  clearAuthError,
  setSortBy,
  setSortOrder,
  sortUniverses,
  clearUniverseError,
  clearUniverseSuccess,
  resetUniverseState,
} = universeSlice.actions;

export default universeSlice.reducer;
