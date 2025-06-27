import { createSlice } from "@reduxjs/toolkit";
import {
  fetchUniverses,
  createUniverse,
  updateUniverse,
  deleteUniverse,
  fetchUniverseById,
  updateHarmonyParams,
  updatePhysicsParams,
} from "../thunks/universeThunks";

const initialState = {
  universes: [],
  loading: false,
  error: null,
  currentUniverse: null,
  lastFetched: null,
  authError: false,
  sortBy: "updated_at",
  sortOrder: "desc",
  success: false,
};

const universeSlice = createSlice({
  name: "universe",
  initialState,
  reducers: {
    setCurrentUniverse: (state, action) => {
      state.currentUniverse = action.payload;
      if (state.universes.length > 0) {
        const index = state.universes.findIndex(
          (u) => u.id === action.payload.id
        );
        if (index !== -1) {
          state.universes[index] = action.payload;
        }
      }
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
          case "name":
            comparison = a.name.localeCompare(b.name);
            break;
          case "created_at":
            comparison = new Date(a.created_at) - new Date(b.created_at);
            break;
          case "updated_at":
            comparison = new Date(a.updated_at) - new Date(b.updated_at);
            break;
          case "is_public":
            comparison = a.is_public === b.is_public ? 0 : a.is_public ? -1 : 1;
            break;
          default:
            comparison = 0;
        }

        return sortOrder === "desc" ? -comparison : comparison;
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
        console.debug("Fetching universes...", {
          currentState: {
            universesCount: state.universes.length,
            loading: state.loading,
            error: state.error,
            authError: state.authError,
          },
        });
        state.loading = true;
        state.error = null;
        state.authError = false;
      })
      .addCase(fetchUniverses.fulfilled, (state, action) => {
        console.debug("Universes fetched successfully:", {
          payload: action.payload,
          currentState: {
            universesCount: state.universes.length,
            loading: state.loading,
            error: state.error,
            authError: state.authError,
          },
        });
        state.loading = false;

        // Handle different response formats
        let universes = [];
        if (Array.isArray(action.payload)) {
          // Direct array format
          universes = action.payload;
        } else if (action.payload.universes && Array.isArray(action.payload.universes)) {
          // Format: { universes: [...] }
          universes = action.payload.universes;
        } else if (action.payload.data && Array.isArray(action.payload.data.universes)) {
          // Format: { data: { universes: [...] } }
          universes = action.payload.data.universes;
        } else if (action.payload.status === "success" && action.payload.data?.universes) {
          // Format: { status: 'success', data: { universes: [...] } }
          universes = action.payload.data.universes;
        } else {
          console.error("Unexpected universes response format:", action.payload);
          universes = [];
        }

        console.debug("Processed universes:", {
          count: universes.length,
          isArray: Array.isArray(universes),
          hasData: !!universes,
          data: universes,
        });

        state.universes = universes;
        state.lastFetched = Date.now();
        state.error = null;
        state.authError = false;
      })
      .addCase(fetchUniverses.rejected, (state, action) => {
        console.error("Failed to fetch universes:", {
          payload: action.payload,
          currentState: {
            universesCount: state.universes.length,
            loading: state.loading,
            error: state.error,
            authError: state.authError,
          },
        });
        state.loading = false;
        state.error = action.payload?.message || action.payload || "Failed to fetch universes";
        state.authError = action.payload?.status === 401 || action.payload?.status === 403;
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
        state.currentUniverse = action.payload?.universe;
      })
      .addCase(fetchUniverseById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch universe";
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
          } else if (
            action.payload.universe &&
            typeof action.payload.universe === "object"
          ) {
            // Response format: { universe: {...} }
            newUniverse = action.payload.universe;
          } else if (action.payload.data && action.payload.data.universe) {
            // Response format: { data: { universe: {...} } }
            newUniverse = action.payload.data.universe;
          } else if (action.payload.id) {
            // Response format: The payload itself is the universe
            newUniverse = action.payload;
          } else if (action.payload.universes && Array.isArray(action.payload.universes) && action.payload.universes.length > 0) {
            // Special case for mock response: { message: '...', universes: [...] }
            // Take the first universe from the array
            newUniverse = action.payload.universes[0];
            console.log("Using first universe from mock data array:", newUniverse);
          } else {
            console.error(
              "Unexpected response format in createUniverse.fulfilled:",
              action.payload
            );
            newUniverse = null;
          }

          // Add the new universe to the universes array if it exists
          if (newUniverse) {
            console.debug("Adding new universe to state:", newUniverse);
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
        console.error("Failed to create universe:", action.payload);
        state.loading = false;
        state.error = action.payload?.message || action.payload || "Failed to create universe";
        state.success = false;
      })

      // Update universe
      .addCase(updateUniverse.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateUniverse.fulfilled, (state, action) => {
        console.debug("Universe updated:", action.payload);
        state.loading = false;
        state.success = true;
        const updatedUniverse = action.payload?.universe;
        if (updatedUniverse) {
          state.universes = state.universes.map((universe) =>
            universe.id === updatedUniverse.id ? updatedUniverse : universe
          );
          if (state.currentUniverse?.id === updatedUniverse.id) {
            state.currentUniverse = updatedUniverse;
          }
        } else {
          console.error(
            "Missing universe data in update response:",
            action.payload
          );
        }
        state.error = null;
        state.authError = false;
      })
      .addCase(updateUniverse.rejected, (state, action) => {
        console.error("Failed to update universe:", action.payload);
        console.log(action.payload.universes);
        state.loading = false;
        state.error = action.payload?.message || action.payload || "Failed to update universe";
        state.success = false;
      })

      // Delete universe
      .addCase(deleteUniverse.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(deleteUniverse.fulfilled, (state, action) => {
        console.debug("Universe deleted successfully:", {
          id: action.meta.arg,
          payload: action.payload
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
        console.error("Failed to delete universe:", {
          error: action.payload,
          meta: action.meta
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
          state.error = "Failed to delete universe. Please try again.";
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
          console.error("Invalid payload received:", action.payload);
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
        console.debug("Physics params updated in store:", {
          id: updatedUniverse.id,
          params: updatedUniverse.physics_params,
        });
      })
      .addCase(updatePhysicsParams.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to update physics parameters";
        console.error("Physics update failed:", action.payload);
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
          console.error("Invalid payload received:", action.payload);
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
        console.debug("Harmony params updated in store:", {
          id: updatedUniverse.id,
          params: updatedUniverse.harmony_params,
        });
      })
      .addCase(updateHarmonyParams.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to update harmony parameters";
        console.error("Harmony update failed:", action.payload);
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
