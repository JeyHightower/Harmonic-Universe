import api from '@/services/api';

import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

/**
 * @typedef {Object} PhysicsConstraint
 * @property {number} id
 * @property {('hinge'|'point'|'distance'|'spring')} type
 * @property {number} objectA
 * @property {number} objectB
 * @property {[number, number, number]} anchor
 * @property {[number, number, number]} [axis]
 * @property {{lower: number, upper: number}} [limits]
 * @property {number} [stiffness]
 * @property {number} [damping]
 */

/**
 * @typedef {Object} PhysicsObject
 * @property {number} id
 * @property {string} type
 * @property {Object} properties
 * @property {Object} transform
 * @property {Object} material
 */

/**
 * @typedef {Object} PhysicsState
 * @property {PhysicsObject[]} objects
 * @property {PhysicsConstraint[]} constraints
 * @property {PhysicsObject|null} currentObject
 * @property {boolean} isSimulating
 * @property {number} timeStep
 * @property {boolean} loading
 * @property {string|null} error
 */

const initialState = {
  objects: [],
  constraints: [],
  currentObject: null,
  isSimulating: false,
  timeStep: 1 / 60,
  loading: false,
  error: null,
};

export const fetchPhysicsObjects = createAsyncThunk(
  'physics/fetchObjects',
  async (projectId) => {
    const response = await api.get(`/api/projects/${projectId}/physics/objects`);
    return response.data;
  }
);

export const fetchPhysicsObject = createAsyncThunk(
  'physics/fetchObject',
  async ({ projectId, objectId }) => {
    const response = await api.get(`/api/projects/${projectId}/physics/objects/${objectId}`);
    return response.data;
  }
);

export const createPhysicsObject = createAsyncThunk(
  'physics/createObject',
  async ({ projectId, data }) => {
    const response = await api.post(`/api/projects/${projectId}/physics/objects`, data);
    return response.data;
  }
);

export const updatePhysicsObject = createAsyncThunk(
  'physics/updateObject',
  async ({ projectId, objectId, data }) => {
    const response = await api.patch(
      `/api/projects/${projectId}/physics/objects/${objectId}`,
      data
    );
    return response.data;
  }
);

export const deletePhysicsObject = createAsyncThunk(
  'physics/deleteObject',
  async ({ projectId, objectId }) => {
    await api.delete(`/api/projects/${projectId}/physics/objects/${objectId}`);
    return objectId;
  }
);

const physicsSlice = createSlice({
  name: 'physics',
  initialState,
  reducers: {
    setTimeStep: (state, action) => {
      state.timeStep = action.payload;
    },
    startSimulation: state => {
      state.isSimulating = true;
    },
    stopSimulation: state => {
      state.isSimulating = false;
    },
    updateObjectTransform: (state, action) => {
      const object = state.objects.find(obj => obj.id === action.payload.id);
      if (object) {
        object.position = action.payload.position;
        object.rotation = action.payload.rotation;
      }
    },
    addObject: (state, action) => {
      state.objects.push(action.payload);
    },
    updateObject: (state, action) => {
      const index = state.objects.findIndex(obj => obj.id === action.payload.id);
      if (index !== -1) {
        state.objects[index] = { ...state.objects[index], ...action.payload };
      }
    },
    deleteObject: (state, action) => {
      state.objects = state.objects.filter(obj => obj.id !== action.payload);
      if (state.currentObject?.id === action.payload) {
        state.currentObject = null;
      }
    },
    setCurrentObject: (state, action) => {
      state.currentObject = action.payload;
    },
    addConstraint: (state, action) => {
      state.constraints.push(action.payload);
    },
    updateConstraint: (state, action) => {
      const index = state.constraints.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.constraints[index] = { ...state.constraints[index], ...action.payload };
      }
    },
    deleteConstraint: (state, action) => {
      state.constraints = state.constraints.filter(c => c.id !== action.payload);
    },
  },
  extraReducers: builder => {
    builder
      // Fetch Objects
      .addCase(fetchPhysicsObjects.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPhysicsObjects.fulfilled, (state, action) => {
        state.loading = false;
        state.objects = action.payload;
      })
      .addCase(fetchPhysicsObjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch physics objects';
      })
      // Fetch Object
      .addCase(fetchPhysicsObject.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPhysicsObject.fulfilled, (state, action) => {
        state.loading = false;
        state.currentObject = action.payload;
      })
      .addCase(fetchPhysicsObject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch physics object';
      })
      // Create Object
      .addCase(createPhysicsObject.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPhysicsObject.fulfilled, (state, action) => {
        state.loading = false;
        state.objects.push(action.payload);
      })
      .addCase(createPhysicsObject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create physics object';
      })
      // Update Object
      .addCase(updatePhysicsObject.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePhysicsObject.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.objects.findIndex(obj => obj.id === action.payload.id);
        if (index !== -1) {
          state.objects[index] = action.payload;
        }
        if (state.currentObject?.id === action.payload.id) {
          state.currentObject = action.payload;
        }
      })
      .addCase(updatePhysicsObject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update physics object';
      })
      // Delete Object
      .addCase(deletePhysicsObject.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePhysicsObject.fulfilled, (state, action) => {
        state.loading = false;
        state.objects = state.objects.filter(obj => obj.id !== action.payload);
        if (state.currentObject?.id === action.payload) {
          state.currentObject = null;
        }
      })
      .addCase(deletePhysicsObject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete physics object';
      });
  },
});

export const {
  setTimeStep,
  startSimulation,
  stopSimulation,
  updateObjectTransform,
  addObject,
  updateObject,
  deleteObject,
  setCurrentObject,
  addConstraint,
  updateConstraint,
  deleteConstraint,
} = physicsSlice.actions;

// Selectors
export const selectPhysicsState = (state) => state.physics;
export const selectObjects = (state) => state.physics.objects;
export const selectConstraints = (state) => state.physics.constraints;
export const selectCurrentObject = (state) => state.physics.currentObject;
export const selectIsSimulating = (state) => state.physics.isSimulating;
export const selectTimeStep = (state) => state.physics.timeStep;
export const selectPhysicsLoading = (state) => state.physics.loading;
export const selectPhysicsError = (state) => state.physics.error;

export default physicsSlice.reducer;
