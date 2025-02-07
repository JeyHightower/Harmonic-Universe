import api from '@/services/api';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

export interface Universe {
  id: number;
  name: string;
  description: string;
  userId: number;
  isPublic: boolean;
  physicsParams: {
    gravity: [number, number, number];
    friction: [number, number, number];
    elasticity: [number, number, number];
    airResistance: [number, number, number];
    timeDilation: number;
    particleMass: number;
    energyDissipation: number;
  };
  harmonyParams: {
    baseFrequency: number;
    harmonicSeries: number[];
    resonance: number;
    damping: number;
    interference: number;
    scale: string;
    tempo: number;
    rhythmPattern: string[];
    aiGenerationParams: {
      style: string;
      complexity: number;
      mood: string;
      intensity: number;
    };
  };
  visualizationParams: {
    colorScheme: string;
    particleCount: number;
    particleSize: number;
    trailLength: number;
    blendMode: string;
    renderQuality: number;
  };
  storyPoints: Array<{
    id: number;
    title: string;
    description: string;
    timestamp: number;
    position: [number, number, number];
    rotation: [number, number, number];
    harmonyTie: {
      frequency: number;
      tempo: number;
      scale: string;
      intensity: number;
    };
    aiGenerated: boolean;
    aiPrompt?: string;
  }>;
  collaborators: Array<{
    userId: number;
    role: 'viewer' | 'editor' | 'admin';
    lastActive: string;
  }>;
}

interface UniverseState {
  universes: Universe[];
  currentUniverse: Universe | null;
  loading: boolean;
  error: string | null;
  realtimeStatus: {
    connected: boolean;
    lastSync: string;
    activeCollaborators: number[];
  };
}

const initialState: UniverseState = {
  universes: [],
  currentUniverse: null,
  loading: false,
  error: null,
  realtimeStatus: {
    connected: false,
    lastSync: '',
    activeCollaborators: [],
  },
};

// Thunks
export const fetchUniverses = createAsyncThunk('universe/fetchUniverses', async () => {
  const response = await api.get('/api/universes');
  return response.data;
});

export const fetchUniverse = createAsyncThunk(
  'universe/fetchUniverse',
  async (universeId: number) => {
    const response = await api.get(`/api/universes/${universeId}`);
    return response.data;
  }
);

export const createUniverse = createAsyncThunk(
  'universe/createUniverse',
  async (data: Partial<Universe>) => {
    const response = await api.post('/api/universes', data);
    return response.data;
  }
);

export const updateUniverse = createAsyncThunk(
  'universe/updateUniverse',
  async ({ universeId, data }: { universeId: number; data: Partial<Universe> }) => {
    const response = await api.put(`/api/universes/${universeId}`, data);
    return response.data;
  }
);

export const deleteUniverse = createAsyncThunk(
  'universe/deleteUniverse',
  async (universeId: number) => {
    await api.delete(`/api/universes/${universeId}`);
    return universeId;
  }
);

export const exportUniverse = createAsyncThunk(
  'universe/exportUniverse',
  async ({
    universeId,
    format,
  }: {
    universeId: number;
    format: 'audio' | 'json' | 'visualization';
  }) => {
    const response = await api.get(`/api/universes/${universeId}/export?format=${format}`);
    return response.data;
  }
);

export const generateWithAI = createAsyncThunk(
  'universe/generateWithAI',
  async ({
    universeId,
    prompt,
    type,
  }: {
    universeId: number;
    prompt: string;
    type: 'story' | 'harmony' | 'physics';
  }) => {
    const response = await api.post(`/api/universes/${universeId}/generate`, { prompt, type });
    return response.data;
  }
);

const universeSlice = createSlice({
  name: 'universe',
  initialState,
  reducers: {
    setCurrentUniverse: (state, action: PayloadAction<Universe | null>) => {
      state.currentUniverse = action.payload;
    },
    updatePhysicsParams: (
      state,
      action: PayloadAction<{
        universeId: number;
        params: Partial<Universe['physicsParams']>;
      }>
    ) => {
      const universe = state.universes.find(u => u.id === action.payload.universeId);
      if (universe) {
        universe.physicsParams = { ...universe.physicsParams, ...action.payload.params };
      }
      if (state.currentUniverse?.id === action.payload.universeId) {
        state.currentUniverse.physicsParams = {
          ...state.currentUniverse.physicsParams,
          ...action.payload.params,
        };
      }
    },
    updateHarmonyParams: (
      state,
      action: PayloadAction<{
        universeId: number;
        params: Partial<Universe['harmonyParams']>;
      }>
    ) => {
      const universe = state.universes.find(u => u.id === action.payload.universeId);
      if (universe) {
        universe.harmonyParams = { ...universe.harmonyParams, ...action.payload.params };
      }
      if (state.currentUniverse?.id === action.payload.universeId) {
        state.currentUniverse.harmonyParams = {
          ...state.currentUniverse.harmonyParams,
          ...action.payload.params,
        };
      }
    },
    addStoryPoint: (
      state,
      action: PayloadAction<{
        universeId: number;
        storyPoint: Omit<Universe['storyPoints'][0], 'id'>;
      }>
    ) => {
      const universe = state.universes.find(u => u.id === action.payload.universeId);
      if (universe) {
        const newId = Math.max(0, ...universe.storyPoints.map(p => p.id)) + 1;
        universe.storyPoints.push({ ...action.payload.storyPoint, id: newId });
      }
    },
    updateStoryPoint: (
      state,
      action: PayloadAction<{
        universeId: number;
        storyPointId: number;
        updates: Partial<Universe['storyPoints'][0]>;
      }>
    ) => {
      const universe = state.universes.find(u => u.id === action.payload.universeId);
      if (universe) {
        const pointIndex = universe.storyPoints.findIndex(
          p => p.id === action.payload.storyPointId
        );
        if (pointIndex !== -1) {
          universe.storyPoints[pointIndex] = {
            ...universe.storyPoints[pointIndex],
            ...action.payload.updates,
          };
        }
      }
    },
    deleteStoryPoint: (
      state,
      action: PayloadAction<{ universeId: number; storyPointId: number }>
    ) => {
      const universe = state.universes.find(u => u.id === action.payload.universeId);
      if (universe) {
        universe.storyPoints = universe.storyPoints.filter(
          p => p.id !== action.payload.storyPointId
        );
      }
    },
    updateRealtimeStatus: (
      state,
      action: PayloadAction<{
        connected: boolean;
        lastSync: string;
        activeCollaborators: number[];
      }>
    ) => {
      state.realtimeStatus = action.payload;
    },
    updateVisualizationParams: (
      state,
      action: PayloadAction<{
        universeId: number;
        params: Partial<Universe['visualizationParams']>;
      }>
    ) => {
      const universe = state.universes.find(u => u.id === action.payload.universeId);
      if (universe) {
        universe.visualizationParams = {
          ...universe.visualizationParams,
          ...action.payload.params,
        };
      }
      if (state.currentUniverse?.id === action.payload.universeId) {
        state.currentUniverse.visualizationParams = {
          ...state.currentUniverse.visualizationParams,
          ...action.payload.params,
        };
      }
    },
    updateAIGenerationParams: (
      state,
      action: PayloadAction<{
        universeId: number;
        params: Partial<Universe['harmonyParams']['aiGenerationParams']>;
      }>
    ) => {
      const universe = state.universes.find(u => u.id === action.payload.universeId);
      if (universe) {
        universe.harmonyParams.aiGenerationParams = {
          ...universe.harmonyParams.aiGenerationParams,
          ...action.payload.params,
        };
      }
      if (state.currentUniverse?.id === action.payload.universeId) {
        state.currentUniverse.harmonyParams.aiGenerationParams = {
          ...state.currentUniverse.harmonyParams.aiGenerationParams,
          ...action.payload.params,
        };
      }
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchUniverses.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUniverses.fulfilled, (state, action) => {
        state.loading = false;
        state.universes = action.payload;
      })
      .addCase(fetchUniverses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch universes';
      })
      .addCase(fetchUniverse.fulfilled, (state, action) => {
        state.currentUniverse = action.payload;
        const index = state.universes.findIndex(u => u.id === action.payload.id);
        if (index !== -1) {
          state.universes[index] = action.payload;
        } else {
          state.universes.push(action.payload);
        }
      })
      .addCase(createUniverse.fulfilled, (state, action) => {
        state.universes.push(action.payload);
        state.currentUniverse = action.payload;
      })
      .addCase(updateUniverse.fulfilled, (state, action) => {
        const index = state.universes.findIndex(u => u.id === action.payload.id);
        if (index !== -1) {
          state.universes[index] = action.payload;
        }
        if (state.currentUniverse?.id === action.payload.id) {
          state.currentUniverse = action.payload;
        }
      })
      .addCase(deleteUniverse.fulfilled, (state, action) => {
        state.universes = state.universes.filter(u => u.id !== action.payload);
        if (state.currentUniverse?.id === action.payload) {
          state.currentUniverse = null;
        }
      })
      .addCase(generateWithAI.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateWithAI.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentUniverse) {
          switch (action.meta.arg.type) {
            case 'story':
              state.currentUniverse.storyPoints.push(action.payload);
              break;
            case 'harmony':
              state.currentUniverse.harmonyParams = {
                ...state.currentUniverse.harmonyParams,
                ...action.payload,
              };
              break;
            case 'physics':
              state.currentUniverse.physicsParams = {
                ...state.currentUniverse.physicsParams,
                ...action.payload,
              };
              break;
          }
        }
      })
      .addCase(generateWithAI.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'AI generation failed';
      });
  },
});

export const {
  setCurrentUniverse,
  updatePhysicsParams,
  updateHarmonyParams,
  addStoryPoint,
  updateStoryPoint,
  deleteStoryPoint,
  updateRealtimeStatus,
  updateVisualizationParams,
  updateAIGenerationParams,
} = universeSlice.actions;

// Selectors
export const selectUniverseState = (state: RootState) => state.universe;
export const selectUniverses = (state: RootState) => state.universe.universes;
export const selectCurrentUniverse = (state: RootState) => state.universe.currentUniverse;
export const selectLoading = (state: RootState) => state.universe.loading;
export const selectError = (state: RootState) => state.universe.error;

export default universeSlice.reducer;
