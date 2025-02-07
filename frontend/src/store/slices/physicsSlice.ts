import axiosInstance from '@/services/api';
import { PhysicsObject } from '@/types';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

interface PhysicsState {
  objects: PhysicsObject[];
  selectedObjectId: number | null;
  isSimulating: boolean;
  timeStep: number;
  loading: boolean;
  error: string | null;
}

const initialState: PhysicsState = {
  objects: [],
  selectedObjectId: null,
  isSimulating: false,
  timeStep: 1 / 60,
  loading: false,
  error: null,
};

export const fetchObjects = createAsyncThunk('physics/fetchObjects', async () => {
  const response = await axiosInstance.get('/physics/objects');
  return response.data;
});

export const createObject = createAsyncThunk(
  'physics/createObject',
  async (object: Omit<PhysicsObject, 'id'>) => {
    const response = await axiosInstance.post('/physics/objects', object);
    return response.data;
  }
);

export const updateObject = createAsyncThunk(
  'physics/updateObject',
  async ({ id, ...updates }: Partial<PhysicsObject> & { id: number }) => {
    const response = await axiosInstance.patch(`/physics/objects/${id}`, updates);
    return response.data;
  }
);

export const deleteObject = createAsyncThunk('physics/deleteObject', async (id: number) => {
  await axiosInstance.delete(`/physics/objects/${id}`);
  return id;
});

const physicsSlice = createSlice({
  name: 'physics',
  initialState,
  reducers: {
    setSelectedObject: (state, action) => {
      state.selectedObjectId = action.payload;
    },
    setSimulationState: (state, action) => {
      state.isSimulating = action.payload;
    },
    setTimeStep: (state, action) => {
      state.timeStep = action.payload;
    },
    clearError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      // Fetch Objects
      .addCase(fetchObjects.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchObjects.fulfilled, (state, action) => {
        state.loading = false;
        state.objects = action.payload;
      })
      .addCase(fetchObjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch objects';
      })
      // Create Object
      .addCase(createObject.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createObject.fulfilled, (state, action) => {
        state.loading = false;
        state.objects.push(action.payload);
      })
      .addCase(createObject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create object';
      })
      // Update Object
      .addCase(updateObject.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateObject.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.objects.findIndex(obj => obj.id === action.payload.id);
        if (index !== -1) {
          state.objects[index] = action.payload;
        }
      })
      .addCase(updateObject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update object';
      })
      // Delete Object
      .addCase(deleteObject.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteObject.fulfilled, (state, action) => {
        state.loading = false;
        state.objects = state.objects.filter(obj => obj.id !== action.payload);
        if (state.selectedObjectId === action.payload) {
          state.selectedObjectId = null;
        }
      })
      .addCase(deleteObject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete object';
      });
  },
});

export const { setSelectedObject, setSimulationState, setTimeStep, clearError } =
  physicsSlice.actions;
export default physicsSlice.reducer;
