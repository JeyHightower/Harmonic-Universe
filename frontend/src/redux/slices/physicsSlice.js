import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { physicsService } from '../../services/physicsService';

// Async thunks
export const fetchPhysicsParameters = createAsyncThunk(
  'physics/fetchParameters',
  async universeId => {
    const response = await physicsService.getPhysicsParameters(universeId);
    return response;
  }
);

export const updatePhysicsParameters = createAsyncThunk(
  'physics/updateParameters',
  async ({ universeId, parameters }) => {
    const response = await physicsService.updatePhysicsParameters(
      universeId,
      parameters
    );
    return response;
  }
);

export const fetchParticleState = createAsyncThunk(
  'physics/fetchParticleState',
  async universeId => {
    const response = await physicsService.getParticleState(universeId);
    return response;
  }
);

export const updateParticleState = createAsyncThunk(
  'physics/updateParticleState',
  async ({ universeId, particles }) => {
    const response = await physicsService.updateParticleState(
      universeId,
      particles
    );
    return response;
  }
);

export const fetchForceFields = createAsyncThunk(
  'physics/fetchForceFields',
  async universeId => {
    const response = await physicsService.getForceFields(universeId);
    return response;
  }
);

const initialState = {
  parameters: {
    gravity: 9.81,
    airResistance: 0.1,
    friction: 0.05,
    elasticity: 0.7,
    timeScale: 1.0,
    maxParticles: 1000,
    particleSize: 5,
    particleLifetime: 5000,
  },
  particles: [],
  forceFields: [],
  status: 'idle',
  error: null,
};

const physicsSlice = createSlice({
  name: 'physics',
  initialState,
  reducers: {
    setParameter: (state, action) => {
      const { name, value } = action.payload;
      state.parameters[name] = value;
    },
    addParticle: (state, action) => {
      state.particles.push(action.payload);
    },
    removeParticle: (state, action) => {
      state.particles = state.particles.filter(p => p.id !== action.payload);
    },
    updateParticle: (state, action) => {
      const index = state.particles.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.particles[index] = action.payload;
      }
    },
    addForceField: (state, action) => {
      state.forceFields.push(action.payload);
    },
    removeForceField: (state, action) => {
      state.forceFields = state.forceFields.filter(
        f => f.id !== action.payload
      );
    },
    updateForceField: (state, action) => {
      const index = state.forceFields.findIndex(
        f => f.id === action.payload.id
      );
      if (index !== -1) {
        state.forceFields[index] = action.payload;
      }
    },
    resetPhysics: state => {
      state.parameters = initialState.parameters;
      state.particles = [];
      state.forceFields = [];
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchPhysicsParameters.pending, state => {
        state.status = 'loading';
      })
      .addCase(fetchPhysicsParameters.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.parameters = action.payload;
      })
      .addCase(fetchPhysicsParameters.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(fetchParticleState.fulfilled, (state, action) => {
        state.particles = action.payload;
      })
      .addCase(updateParticleState.fulfilled, (state, action) => {
        state.particles = action.payload;
      })
      .addCase(fetchForceFields.fulfilled, (state, action) => {
        state.forceFields = action.payload;
      });
  },
});

export const {
  setParameter,
  addParticle,
  removeParticle,
  updateParticle,
  addForceField,
  removeForceField,
  updateForceField,
  resetPhysics,
} = physicsSlice.actions;

export default physicsSlice.reducer;
