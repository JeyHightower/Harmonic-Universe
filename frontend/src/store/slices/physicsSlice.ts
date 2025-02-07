import api from '@/services/api';
import { PhysicsObject } from '@/types/physics';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

export interface PhysicsConstraint {
  id: number;
  type: 'hinge' | 'point' | 'distance' | 'spring';
  objectA: number;
  objectB: number;
  anchor: [number, number, number];
  axis?: [number, number, number];
  limits?: {
    lower: number;
    upper: number;
  };
  stiffness?: number;
  damping?: number;
}

export interface PhysicsState {
  objects: PhysicsObject[];
  constraints: PhysicsConstraint[];
  currentObject: PhysicsObject | null;
  isSimulating: boolean;
  timeStep: number;
  loading: boolean;
  error: string | null;
}

const initialState: PhysicsState = {
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
    const response = await api.patch(
      `/api/projects/${projectId}/physics/objects/${objectId}`,
      data
    );
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
    setTimeStep: (state, action: PayloadAction<number>) => {
      state.timeStep = action.payload;
    },
    startSimulation: state => {
      state.isSimulating = true;
    },
    stopSimulation: state => {
      state.isSimulating = false;
    },
    updateObjectTransform: (
      state,
      action: PayloadAction<{
        id: number;
        position: [number, number, number];
        rotation: [number, number, number];
      }>
    ) => {
      const object = state.objects.find(obj => obj.id === action.payload.id);
      if (object) {
        object.position = action.payload.position;
        object.rotation = action.payload.rotation;
      }
    },
    addObject: (state, action: PayloadAction<PhysicsObject>) => {
      state.objects.push(action.payload);
    },
    updateObject: (state, action: PayloadAction<Partial<PhysicsObject> & { id: number }>) => {
      const index = state.objects.findIndex(obj => obj.id === action.payload.id);
      if (index !== -1) {
        state.objects[index] = { ...state.objects[index], ...action.payload };
      }
    },
    deleteObject: (state, action: PayloadAction<number>) => {
      state.objects = state.objects.filter(obj => obj.id !== action.payload);
      if (state.currentObject?.id === action.payload) {
        state.currentObject = null;
      }
    },
    setCurrentObject: (state, action: PayloadAction<PhysicsObject | null>) => {
      state.currentObject = action.payload;
    },
    addConstraint: (state, action: PayloadAction<PhysicsConstraint>) => {
      state.constraints.push(action.payload);
    },
    updateConstraint: (
      state,
      action: PayloadAction<Partial<PhysicsConstraint> & { id: number }>
    ) => {
      const index = state.constraints.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.constraints[index] = { ...state.constraints[index], ...action.payload };
      }
    },
    deleteConstraint: (state, action: PayloadAction<number>) => {
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
export const selectPhysicsState = (state: RootState) => state.physics;
export const selectObjects = (state: RootState) => state.physics.objects;
export const selectConstraints = (state: RootState) => state.physics.constraints;
export const selectCurrentObject = (state: RootState) => state.physics.currentObject;
export const selectIsSimulating = (state: RootState) => state.physics.isSimulating;
export const selectTimeStep = (state: RootState) => state.physics.timeStep;

export default physicsSlice.reducer;
