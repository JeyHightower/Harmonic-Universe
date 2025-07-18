import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { universeService } from '../../services/universe.service.mjs';
import {
  createUniverse,
  deleteUniverse,
  fetchUniverseById,
  fetchUniverses,
  updateHarmonyParams,
  updatePhysicsParams,
  updateUniverse,
} from '../thunks/universeThunks.mjs';

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

export const loadUniverses = createAsyncThunk('universes/load', async (_, { rejectWithValue }) => {
  try {
    const response = await universeService.getAllUniverses();

    // Check if response exists and has the expected structure
    if (!response || typeof response !== 'object') {
      console.error('Invalid response format from universe loading:', response);
      return rejectWithValue('Invalid response format from server');
    }

    // Check if the response has the universes property
    if (!response.universes || !Array.isArray(response.universes)) {
      console.error('Response missing universes array:', response);
      return rejectWithValue('Invalid universe data format');
    }

    return response.universes;
  } catch (error) {
    console.error('Error loading universes:', error);
    return rejectWithValue(error.message || 'Failed to load universes');
  }
});

const universeSlice = createSlice({
  name: 'universe',
  initialState,
  reducers: {
    setCurrentUniverse: (state, action) => {
      state.currentUniverse = action.payload;
      if (state.universes.length > 0) {
        const index = state.universes.findIndex((u) => u.id === action.payload.id);
        if (index !== -1) {
          state.universes[index] = action.payload;
        }
      }
    },
    clearCurrentUniverse: (state) => {
      state.currentUniverse = null;
    },
    clearError: (state) => {
      state.error = null;
      state.authError = false;
    },
    resetState: () => initialState,
    clearAuthError: (state) => {
      state.authError = false;
    },
    setSortBy: (state, action) => {
      state.sortBy = action.payload;
    },
    setSortOrder: (state, action) => {
      state.sortOrder = action.payload;
    },
    sortUniverses: (state) => {
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
  extraReducers: (builder) => {
    // Fetch universes
    builder
      .addCase(fetchUniverses.pending, (state) => {
        console.debug('Fetching universes...', {
          currentState: {
            universesCount: state.universes.length,
            loading: state.loading,
            error: state.error,
            authError: state.authError,
          },
        });
        state.loading = true;
        state.error = null;
        state.status = 'loading';
      })
      .addCase(fetchUniverses.fulfilled, (state, action) => {
        console.debug('Universes fetched successfully:', {
          payload: action.payload,
          currentState: {
            universesCount: state.universes.length,
            loading: state.loading,
            error: state.error,
            authError: state.authError,
          },
        });
        state.loading = false;
        state.universes = action.payload;
        state.lastFetched = new Date().toISOString();
        state.status = 'succeeded';
        state.success = true;
      })
      .addCase(fetchUniverses.rejected, (state, action) => {
        console.error('Failed to fetch universes:', {
          payload: action.payload,
          currentState: {
            universesCount: state.universes.length,
            loading: state.loading,
            error: state.error,
            authError: state.authError,
          },
        });
        state.loading = false;
        state.error = action.payload || 'Failed to fetch universes';
        state.status = 'failed';
        state.success = false;
        // Check if the error is an auth error
        if (
          action.payload?.includes('authentication') ||
          action.payload?.includes('unauthorized')
        ) {
          state.authError = true;
          state.universes = []; // Clear universes on auth error
        }
      })

      // Fetch universe by ID
      .addCase(fetchUniverseById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUniverseById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUniverse = action.payload?.universe;
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
        state.loading = false;
        state.success = true;

        // Process different possible response formats
        if (action.payload) {
          let newUniverse = null;

          if (action.payload.data?.status === 'success' && action.payload.data?.universe) {
            // Simple backend format: { status: 'success', data: { universe: {...} } }
            newUniverse = action.payload.data.universe;
          } else if (action.payload.universe && typeof action.payload.universe === 'object') {
            // Response format: { universe: {...} }
            newUniverse = action.payload.universe;
          } else if (action.payload.data && action.payload.data.universe) {
            // Response format: { data: { universe: {...} } }
            newUniverse = action.payload.data.universe;
          } else if (action.payload.id) {
            // Response format: The payload itself is the universe
            newUniverse = action.payload;
          } else if (
            action.payload.universes &&
            Array.isArray(action.payload.universes) &&
            action.payload.universes.length > 0
          ) {
            // Special case for mock response: { message: '...', universes: [...] }
            // Take the first universe from the array
            newUniverse = action.payload.universes[0];
            console.log('Using first universe from mock data array:', newUniverse);
          } else {
            console.error(
              'Unexpected response format in createUniverse.fulfilled:',
              action.payload
            );
            newUniverse = null;
          }

          // Add the new universe to the universes array if it exists
          if (newUniverse) {
            console.debug('Adding new universe to state:', newUniverse);
            // Ensure universes is an array
            if (!Array.isArray(state.universes)) {
              state.universes = [];
            }
            // Add the new universe to the beginning of the array
            state.universes = [newUniverse, ...state.universes];
            state.currentUniverse = newUniverse;
          }
        }

        state.error = null;
        state.authError = false;
      })
      .addCase(createUniverse.rejected, (state, action) => {
        console.error('Failed to create universe:', action.payload);
        state.loading = false;
        state.error = action.payload?.message || action.payload || 'Failed to create universe';
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

        // Check for various response formats
        const updatedUniverse =
          action.payload?.universe || (action.payload?.id ? action.payload : null);

        if (updatedUniverse) {
          state.universes = state.universes.map((universe) =>
            universe.id === updatedUniverse.id ? updatedUniverse : universe
          );
          if (state.currentUniverse?.id === updatedUniverse.id) {
            state.currentUniverse = updatedUniverse;
          }
        } else if (action.payload?.message === 'Access denied') {
          // Handle access denied case
          state.error = "You don't have permission to update this universe";
          state.authError = true;
          state.success = false;
        } else {
          console.warn(
            'Missing universe data in update response, but operation succeeded:',
            action.payload
          );
          // Operation still succeeded if we got this far
        }

        // Clear error if operation succeeded
        if (state.success) {
          state.error = null;
          state.authError = false;
        }
      })
      .addCase(updateUniverse.rejected, (state, action) => {
        console.error('Failed to update universe:', action.payload);
        state.loading = false;
        state.error = action.payload?.message || action.payload || 'Failed to update universe';
        state.success = false;
      })

      // Delete universe
      .addCase(deleteUniverse.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(deleteUniverse.fulfilled, (state, action) => {
        console.debug('Universe deleted successfully:', {
          id: action.meta.arg,
          payload: action.payload,
        });

        state.loading = false;
        state.success = true;

        const deletedId = action.meta.arg;

        // Filter out the deleted universe from the list
        const previousCount = state.universes.length;
        state.universes = state.universes.filter((u) => {
          // Normalize ID types for comparison (string vs number)
          return String(u.id) !== String(deletedId);
        });
        const newCount = state.universes.length;

        console.log(`Universe removal: removed ${previousCount - newCount} universes from state`);

        // Clear current universe if it was the one deleted
        if (state.currentUniverse && String(state.currentUniverse.id) === String(deletedId)) {
          console.log(`Clearing current universe (${deletedId}) as it was deleted`);
          state.currentUniverse = null;
        }

        state.error = null;
        state.authError = false;
      })
      .addCase(deleteUniverse.rejected, (state, action) => {
        console.error('Failed to delete universe:', {
          error: action.payload,
          meta: action.meta,
        });

        state.loading = false;

        // Detailed error message
        if (action.payload?.data?.error) {
          state.error = `Failed to delete universe: ${action.payload.data.error}`;
        } else if (action.payload?.message) {
          state.error = `Failed to delete universe: ${action.payload.message}`;
        } else if (typeof action.payload === 'string') {
          state.error = `Failed to delete universe: ${action.payload}`;
        } else {
          state.error = 'Failed to delete universe. Please try again.';
        }

        state.success = false;
      })

      // Handle physics params update
      .addCase(updatePhysicsParams.pending, (state) => {
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

        const updatedUniverse = action.payload;

        // Update current universe if it matches
        if (state.currentUniverse?.id === updatedUniverse.id) {
          state.currentUniverse = updatedUniverse;
        }

        // Update in universes list if present
        state.universes = state.universes.map((universe) =>
          universe.id === updatedUniverse.id ? updatedUniverse : universe
        );

        // Log the update for debugging
        console.debug('Physics params updated in store:', {
          id: updatedUniverse.id,
          params: updatedUniverse.physics_params,
        });
      })
      .addCase(updatePhysicsParams.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update physics parameters';
        console.error('Physics update failed:', action.payload);
      })

      // Handle harmony params update
      .addCase(updateHarmonyParams.pending, (state) => {
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

        const updatedUniverse = action.payload;

        // Update current universe if it matches
        if (state.currentUniverse?.id === updatedUniverse.id) {
          state.currentUniverse = updatedUniverse;
        }

        // Update in universes list if present
        state.universes = state.universes.map((universe) =>
          universe.id === updatedUniverse.id ? updatedUniverse : universe
        );

        // Log the update for debugging
        console.debug('Harmony params updated in store:', {
          id: updatedUniverse.id,
          params: updatedUniverse.harmony_params,
        });
      })
      .addCase(updateHarmonyParams.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update harmony parameters';
        console.error('Harmony update failed:', action.payload);
      })

      // Load universes
      .addCase(loadUniverses.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loadUniverses.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.universes = action.payload;
        state.error = null;
      })
      .addCase(loadUniverses.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to load universes';
        state.universes = []; // Reset universes on error
      });
  },
});

export const {
  setCurrentUniverse,
  clearCurrentUniverse,
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
