import { createSlice } from "@reduxjs/toolkit";
import {
  fetchPhysicsObjects,
  createPhysicsObject,
  updatePhysicsObject,
  deletePhysicsObject,
} from "../thunks/physicsObjectsThunks";

const initialState = {
  physicsObjects: [],
  currentPhysicsObject: null,
  loading: false,
  error: null,
};

const physicsObjectsSlice = createSlice({
  name: "physicsObjects",
  initialState,
  reducers: {
    setCurrentPhysicsObject: (state, action) => {
      state.currentPhysicsObject = action.payload;
    },
    clearCurrentPhysicsObject: (state) => {
      state.currentPhysicsObject = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetState: () => initialState,
  },
  extraReducers: (builder) => {
    // Fetch physics objects
    builder
      .addCase(fetchPhysicsObjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPhysicsObjects.fulfilled, (state, action) => {
        state.loading = false;
        state.physicsObjects = action.payload;
        state.error = null;
      })
      .addCase(fetchPhysicsObjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create physics object
      .addCase(createPhysicsObject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPhysicsObject.fulfilled, (state, action) => {
        state.loading = false;
        state.physicsObjects.push(action.payload);
        state.currentPhysicsObject = action.payload;
        state.error = null;
      })
      .addCase(createPhysicsObject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update physics object
      .addCase(updatePhysicsObject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePhysicsObject.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.physicsObjects.findIndex(
          (obj) => obj.id === action.payload.id
        );
        if (index !== -1) {
          state.physicsObjects[index] = action.payload;
        }
        if (state.currentPhysicsObject?.id === action.payload.id) {
          state.currentPhysicsObject = action.payload;
        }
        state.error = null;
      })
      .addCase(updatePhysicsObject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete physics object
      .addCase(deletePhysicsObject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePhysicsObject.fulfilled, (state, action) => {
        state.loading = false;
        state.physicsObjects = state.physicsObjects.filter(
          (obj) => obj.id !== action.payload
        );
        if (state.currentPhysicsObject?.id === action.payload) {
          state.currentPhysicsObject = null;
        }
        state.error = null;
      })
      .addCase(deletePhysicsObject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// Selectors
export const selectPhysicsObjects = (state) =>
  state.physicsObjects.physicsObjects;

export const {
  setCurrentPhysicsObject,
  clearCurrentPhysicsObject,
  clearError,
  resetState,
} = physicsObjectsSlice.actions;

export default physicsObjectsSlice.reducer;
