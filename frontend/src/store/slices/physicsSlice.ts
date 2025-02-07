import api from '@/services/api';
import { PhysicsObject } from '@/types/physics';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

interface PhysicsState {
  objects: PhysicsObject[];
  currentObject: PhysicsObject | null;
  loading: boolean;
  error: string | null;
  isSimulating: boolean;
  timeStep: number;
}

const initialState: PhysicsState = {
  objects: [],
  currentObject: null,
  loading: false,
  error: null,
  isSimulating: false,
  timeStep: 1 / 60,
};

export const fetchPhysicsObjects = createAsyncThunk(
  'physics/fetchObjects',
  async (projectId: number) => {
    const response = await api.get(`/api/projects/${projectId}/physics/objects`);
    return response.data;
  }
);

export const fetchPhysicsObject = createAsyncThunk(
  'physics/fetchObject',
  async ({ projectId, objectId }: { projectId: number; objectId: number }) => {
    const response = await api.get(`/api/projects/${projectId}/physics/objects/${objectId}`);
    return response.data;
  }
);

export const createPhysicsObject = createAsyncThunk(
  'physics/createObject',
  async ({ projectId, data }: { projectId: number; data: Partial<PhysicsObject> }) => {
    const response = await api.post(`/api/projects/${projectId}/physics/objects`, data);
    return response.data;
  }
);

export const updatePhysicsObject = createAsyncThunk(
  'physics/updateObject',
  async ({
    projectId,
    objectId,
    data,
  }: {
    projectId: number;
    objectId: number;
    data: Partial<PhysicsObject>;
  }) => {
    const response = await api.put(`/api/projects/${projectId}/physics/objects/${objectId}`, data);
    return response.data;
  }
);

export const deletePhysicsObject = createAsyncThunk(
  'physics/deleteObject',
  async ({ projectId, objectId }: { projectId: number; objectId: number }) => {
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
        const index = state.objects.findIndex(o => o.id === action.payload.id);
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
        state.objects = state.objects.filter(o => o.id !== action.payload);
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

export const { setTimeStep, startSimulation, stopSimulation } = physicsSlice.actions;

export const selectPhysicsObjects = (state: { physics: PhysicsState }) => state.physics.objects;
export const selectCurrentPhysicsObject = (state: { physics: PhysicsState }) =>
  state.physics.currentObject;
export const selectPhysicsLoading = (state: { physics: PhysicsState }) => state.physics.loading;
export const selectPhysicsError = (state: { physics: PhysicsState }) => state.physics.error;
export const selectIsSimulating = (state: { physics: PhysicsState }) => state.physics.isSimulating;
export const selectTimeStep = (state: { physics: PhysicsState }) => state.physics.timeStep;

export default physicsSlice.reducer;
