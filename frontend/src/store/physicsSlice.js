import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import physicsService from '../services/physicsService';

// Async thunks
export const createPhysicsObject = createAsyncThunk(
  'physics/createObject',
  async (data) => {
    const response = await physicsService.createPhysicsObject(data);
    return response;
  }
);

export const getPhysicsObject = createAsyncThunk(
  'physics/getObject',
  async (objectId) => {
    const response = await physicsService.getPhysicsObject(objectId);
    return response;
  }
);

export const updatePhysicsObject = createAsyncThunk(
  'physics/updateObject',
  async ({ objectId, data }) => {
    const response = await physicsService.updatePhysicsObject(objectId, data);
    return response;
  }
);

export const deletePhysicsObject = createAsyncThunk(
  'physics/deleteObject',
  async (objectId) => {
    await physicsService.deletePhysicsObject(objectId);
    return objectId;
  }
);

export const createPhysicsConstraint = createAsyncThunk(
  'physics/createConstraint',
  async (data) => {
    const response = await physicsService.createPhysicsConstraint(data);
    return response;
  }
);

export const getPhysicsConstraint = createAsyncThunk(
  'physics/getConstraint',
  async (constraintId) => {
    const response = await physicsService.getPhysicsConstraint(constraintId);
    return response;
  }
);

export const updatePhysicsConstraint = createAsyncThunk(
  'physics/updateConstraint',
  async ({ constraintId, data }) => {
    const response = await physicsService.updatePhysicsConstraint(constraintId, data);
    return response;
  }
);

export const deletePhysicsConstraint = createAsyncThunk(
  'physics/deleteConstraint',
  async (constraintId) => {
    await physicsService.deletePhysicsConstraint(constraintId);
    return constraintId;
  }
);

export const simulateScene = createAsyncThunk(
  'physics/simulateScene',
  async (sceneId) => {
    const response = await physicsService.simulateScene(sceneId);
    return response;
  }
);

// Initial state
const initialState = {
  objects: {},
  constraints: {},
  loading: false,
  error: null,
  simulationInProgress: false
};

// Slice
const physicsSlice = createSlice({
  name: 'physics',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetPhysics: () => initialState
  },
  extraReducers: (builder) => {
    builder
      // Create physics object
      .addCase(createPhysicsObject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPhysicsObject.fulfilled, (state, action) => {
        state.loading = false;
        state.objects[action.payload.id] = action.payload;
      })
      .addCase(createPhysicsObject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Get physics object
      .addCase(getPhysicsObject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPhysicsObject.fulfilled, (state, action) => {
        state.loading = false;
        state.objects[action.payload.id] = action.payload;
      })
      .addCase(getPhysicsObject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Update physics object
      .addCase(updatePhysicsObject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePhysicsObject.fulfilled, (state, action) => {
        state.loading = false;
        state.objects[action.payload.id] = action.payload;
      })
      .addCase(updatePhysicsObject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Delete physics object
      .addCase(deletePhysicsObject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePhysicsObject.fulfilled, (state, action) => {
        state.loading = false;
        delete state.objects[action.payload];
      })
      .addCase(deletePhysicsObject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Create physics constraint
      .addCase(createPhysicsConstraint.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPhysicsConstraint.fulfilled, (state, action) => {
        state.loading = false;
        state.constraints[action.payload.id] = action.payload;
      })
      .addCase(createPhysicsConstraint.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Get physics constraint
      .addCase(getPhysicsConstraint.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPhysicsConstraint.fulfilled, (state, action) => {
        state.loading = false;
        state.constraints[action.payload.id] = action.payload;
      })
      .addCase(getPhysicsConstraint.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Update physics constraint
      .addCase(updatePhysicsConstraint.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePhysicsConstraint.fulfilled, (state, action) => {
        state.loading = false;
        state.constraints[action.payload.id] = action.payload;
      })
      .addCase(updatePhysicsConstraint.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Delete physics constraint
      .addCase(deletePhysicsConstraint.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePhysicsConstraint.fulfilled, (state, action) => {
        state.loading = false;
        delete state.constraints[action.payload];
      })
      .addCase(deletePhysicsConstraint.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Simulate scene
      .addCase(simulateScene.pending, (state) => {
        state.simulationInProgress = true;
        state.error = null;
      })
      .addCase(simulateScene.fulfilled, (state, action) => {
        state.simulationInProgress = false;
        action.payload.forEach(object => {
          state.objects[object.id] = object;
        });
      })
      .addCase(simulateScene.rejected, (state, action) => {
        state.simulationInProgress = false;
        state.error = action.error.message;
      });
  }
});

// Actions
export const { clearError, resetPhysics } = physicsSlice.actions;

// Selectors
export const selectPhysicsObjects = (state) => state.physics.objects;
export const selectPhysicsConstraints = (state) => state.physics.constraints;
export const selectPhysicsLoading = (state) => state.physics.loading;
export const selectPhysicsError = (state) => state.physics.error;
export const selectSimulationInProgress = (state) => state.physics.simulationInProgress;

export default physicsSlice.reducer;
