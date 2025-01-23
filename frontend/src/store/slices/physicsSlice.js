import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

// Async thunk for fetching physics parameters
export const fetchPhysicsParameters = createAsyncThunk(
  'physics/fetchParameters',
  async universeId => {
    try {
      const response = await fetch(`/api/universe/${universeId}/physics`);
      if (!response.ok) throw new Error('Failed to fetch physics parameters');
      return await response.json();
    } catch (error) {
      throw error;
    }
  }
);

const initialState = {
  parameters: {
    gravity: 9.81,
    friction: 0.5,
    elasticity: 0.7,
    airResistance: 0.1,
  },
  isLoading: false,
  error: null,
};

const physicsSlice = createSlice({
  name: 'physics',
  initialState,
  reducers: {
    setParameters: (state, action) => {
      state.parameters = action.payload;
    },
    updateParameter: (state, action) => {
      const { parameter, value } = action.payload;
      state.parameters[parameter] = value;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchPhysicsParameters.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPhysicsParameters.fulfilled, (state, action) => {
        state.isLoading = false;
        state.parameters = action.payload;
      })
      .addCase(fetchPhysicsParameters.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      });
  },
});

export const { setParameters, updateParameter, setLoading, setError } =
  physicsSlice.actions;

export default physicsSlice.reducer;
