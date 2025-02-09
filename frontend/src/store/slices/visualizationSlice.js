import api from '@/services/api';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

/**
 * @typedef {Object} WebGLState
 * @property {boolean} initialized
 * @property {Object} context
 * @property {Object} renderer
 * @property {Object} scene
 * @property {Object} camera
 * @property {Object} controls
 */

/**
 * @typedef {Object} AudioAnalysisState
 * @property {boolean} initialized
 * @property {AudioContext} context
 * @property {AnalyserNode} analyser
 * @property {Float32Array} timeData
 * @property {Float32Array} frequencyData
 * @property {Object} bands
 */

/**
 * @typedef {Object} VisualizationState
 * @property {Array} visualizations
 * @property {Object|null} currentVisualization
 * @property {WebGLState} webgl
 * @property {AudioAnalysisState} audioAnalysis
 * @property {Array} presets
 * @property {Object|null} activePreset
 * @property {boolean} isPlaying
 * @property {boolean} loading
 * @property {string|null} error
 */

const initialState = {
  visualizations: [],
  currentVisualization: null,
  webgl: {
    initialized: false,
    context: null,
    renderer: null,
    scene: null,
    camera: null,
    controls: null,
  },
  audioAnalysis: {
    initialized: false,
    context: null,
    analyser: null,
    timeData: null,
    frequencyData: null,
    bands: {},
  },
  presets: [],
  activePreset: null,
  isPlaying: false,
  loading: false,
  error: null,
};

export const fetchVisualizations = createAsyncThunk('visualization/fetchAll', async projectId => {
  const response = await api.get(`/api/visualizations?project_id=${projectId}`);
  return response.data;
});

export const fetchVisualizationsByAudio = createAsyncThunk(
  'visualization/fetchByAudio',
  async audioId => {
    const response = await api.get(`/api/visualizations?audio_id=${audioId}`);
    return response.data;
  }
);

export const fetchVisualization = createAsyncThunk('visualization/fetchOne', async id => {
  const response = await api.get(`/api/visualizations/${id}`);
  return response.data;
});

export const createVisualization = createAsyncThunk(
  'visualization/create',
  async ({ projectId, audioId, data }) => {
    const response = await api.post('/api/visualizations', {
      ...data,
      project_id: projectId,
      audio_id: audioId,
    });
    return response.data;
  }
);

export const updateVisualization = createAsyncThunk(
  'visualization/update',
  async ({ id, data }) => {
    const response = await api.put(`/api/visualizations/${id}`, data);
    return response.data;
  }
);

export const deleteVisualization = createAsyncThunk('visualization/delete', async id => {
  await api.delete(`/api/visualizations/${id}`);
  return id;
});

export const updateDataMappings = createAsyncThunk(
  'visualization/updateDataMappings',
  async ({ id, dataMappings }) => {
    const response = await api.put(`/api/visualizations/${id}/mappings`, { dataMappings });
    return response.data;
  }
);

export const updateStreamConfig = createAsyncThunk(
  'visualization/updateStreamConfig',
  async ({ id, streamConfig }) => {
    const response = await api.put(`/api/visualizations/${id}/stream-config`, { streamConfig });
    return response.data;
  }
);

export const fetchPresets = createAsyncThunk('visualization/fetchPresets', async () => {
  const response = await api.get('/api/visualizations/presets');
  return response.data;
});

export const savePreset = createAsyncThunk('visualization/savePreset', async preset => {
  const response = await api.post('/api/visualizations/presets', preset);
  return response.data;
});

export const applyPreset = createAsyncThunk(
  'visualization/applyPreset',
  async ({ visualizationId, presetId }) => {
    const response = await api.post(`/api/visualizations/${visualizationId}/presets/${presetId}`);
    return response.data;
  }
);

export const updateEffect = createAsyncThunk(
  'visualization/updateEffect',
  async ({ visualizationId, effectId, updates }) => {
    const response = await api.put(
      `/api/visualizations/${visualizationId}/effects/${effectId}`,
      updates
    );
    return response.data;
  }
);

const visualizationSlice = createSlice({
  name: 'visualization',
  initialState,
  reducers: {
    setCurrentVisualization: (state, action) => {
      state.currentVisualization = action.payload;
    },
    addVisualization: (state, action) => {
      state.visualizations.push(action.payload);
    },
    updateVisualizationState: (state, action) => {
      const index = state.visualizations.findIndex(v => v.id === action.payload.id);
      if (index !== -1) {
        state.visualizations[index] = { ...state.visualizations[index], ...action.payload };
      }
    },
    deleteVisualizationState: (state, action) => {
      state.visualizations = state.visualizations.filter(v => v.id !== action.payload);
      if (state.currentVisualization?.id === action.payload) {
        state.currentVisualization = null;
      }
    },
    setIsPlaying: (state, action) => {
      state.isPlaying = action.payload;
    },
    addObject: (state, action) => {
      const visualization = state.visualizations.find(v => v.id === action.payload.visualizationId);
      if (visualization) {
        visualization.objects.push(action.payload.object);
      }
    },
    updateObject: (state, action) => {
      const visualization = state.visualizations.find(v => v.id === action.payload.visualizationId);
      if (visualization) {
        const objectIndex = visualization.objects.findIndex(o => o.id === action.payload.objectId);
        if (objectIndex !== -1) {
          visualization.objects[objectIndex] = {
            ...visualization.objects[objectIndex],
            ...action.payload.updates,
          };
        }
      }
    },
    deleteObject: (state, action) => {
      const visualization = state.visualizations.find(v => v.id === action.payload.visualizationId);
      if (visualization) {
        visualization.objects = visualization.objects.filter(o => o.id !== action.payload.objectId);
      }
    },
    initWebGL: (state, action) => {
      state.webgl = {
        ...state.webgl,
        ...action.payload,
        initialized: true,
      };
    },
    initAudioAnalysis: (state, action) => {
      state.audioAnalysis = {
        ...state.audioAnalysis,
        ...action.payload,
        initialized: true,
      };
    },
    updateAudioData: (state, action) => {
      if (state.audioAnalysis.initialized) {
        state.audioAnalysis.timeData = action.payload.timeData;
        state.audioAnalysis.frequencyData = action.payload.frequencyData;
        state.audioAnalysis.bands = action.payload.bands;
      }
    },
    setActivePreset: (state, action) => {
      state.activePreset = action.payload;
    },
    updateEffectParameter: (state, action) => {
      const { effectId, parameter, value } = action.payload;
      const effect = state.currentVisualization?.settings.effects.find(e => e.id === effectId);
      if (effect) {
        effect.parameters[parameter] = value;
      }
    },
    updateWebGLSettings: (state, action) => {
      if (state.currentVisualization) {
        state.currentVisualization.settings.webgl = {
          ...state.currentVisualization.settings.webgl,
          ...action.payload,
        };
      }
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchVisualizations.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVisualizations.fulfilled, (state, action) => {
        state.loading = false;
        state.visualizations = action.payload;
      })
      .addCase(fetchVisualizations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch visualizations';
      })
      .addCase(fetchVisualizationsByAudio.fulfilled, (state, action) => {
        state.visualizations = action.payload;
      })
      .addCase(fetchVisualization.fulfilled, (state, action) => {
        const index = state.visualizations.findIndex(v => v.id === action.payload.id);
        if (index !== -1) {
          state.visualizations[index] = action.payload;
        } else {
          state.visualizations.push(action.payload);
        }
        if (state.currentVisualization?.id === action.payload.id) {
          state.currentVisualization = action.payload;
        }
      })
      .addCase(createVisualization.fulfilled, (state, action) => {
        state.visualizations.push(action.payload);
      })
      .addCase(updateVisualization.fulfilled, (state, action) => {
        const index = state.visualizations.findIndex(v => v.id === action.payload.id);
        if (index !== -1) {
          state.visualizations[index] = action.payload;
        }
        if (state.currentVisualization?.id === action.payload.id) {
          state.currentVisualization = action.payload;
        }
      })
      .addCase(deleteVisualization.fulfilled, (state, action) => {
        state.visualizations = state.visualizations.filter(v => v.id !== action.payload);
        if (state.currentVisualization?.id === action.payload) {
          state.currentVisualization = null;
        }
      })
      .addCase(updateDataMappings.fulfilled, (state, action) => {
        const visualization = state.visualizations.find(v => v.id === action.payload.id);
        if (visualization) {
          visualization.dataMappings = action.payload.dataMappings;
        }
        if (state.currentVisualization?.id === action.payload.id) {
          state.currentVisualization = {
            ...state.currentVisualization,
            dataMappings: action.payload.dataMappings,
          };
        }
      })
      .addCase(updateStreamConfig.fulfilled, (state, action) => {
        const visualization = state.visualizations.find(v => v.id === action.payload.id);
        if (visualization) {
          visualization.streamConfig = action.payload.streamConfig;
        }
        if (state.currentVisualization?.id === action.payload.id) {
          state.currentVisualization = {
            ...state.currentVisualization,
            streamConfig: action.payload.streamConfig,
          };
        }
      })
      .addCase(fetchPresets.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPresets.fulfilled, (state, action) => {
        state.loading = false;
        state.presets = action.payload;
      })
      .addCase(fetchPresets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch presets';
      })
      .addCase(savePreset.fulfilled, (state, action) => {
        state.presets.push(action.payload);
      })
      .addCase(applyPreset.fulfilled, (state, action) => {
        if (state.currentVisualization?.id === action.payload.id) {
          state.currentVisualization = action.payload;
        }
        const index = state.visualizations.findIndex(v => v.id === action.payload.id);
        if (index !== -1) {
          state.visualizations[index] = action.payload;
        }
      })
      .addCase(updateEffect.fulfilled, (state, action) => {
        if (state.currentVisualization?.id === action.payload.visualizationId) {
          const effectIndex = state.currentVisualization.settings.effects.findIndex(
            e => e.id === action.payload.effectId
          );
          if (effectIndex !== -1) {
            state.currentVisualization.settings.effects[effectIndex] = action.payload.effect;
          }
        }
      });
  },
});

export const {
  setCurrentVisualization,
  addVisualization,
  updateVisualizationState,
  deleteVisualizationState,
  setIsPlaying,
  addObject,
  updateObject,
  deleteObject,
  initWebGL,
  initAudioAnalysis,
  updateAudioData,
  setActivePreset,
  updateEffectParameter,
  updateWebGLSettings,
} = visualizationSlice.actions;

export const selectVisualizationState = state => state.visualization;
export const selectVisualizations = state => state.visualization.visualizations;
export const selectCurrentVisualization = state => state.visualization.currentVisualization;
export const selectVisualizationLoading = state => state.visualization.loading;
export const selectVisualizationError = state => state.visualization.error;
export const selectWebGLState = state => state.visualization.webgl;
export const selectAudioAnalysisState = state => state.visualization.audioAnalysis;
export const selectPresets = state => state.visualization.presets;
export const selectActivePreset = state => state.visualization.activePreset;
export const selectIsPlaying = state => state.visualization.isPlaying;

export default visualizationSlice.reducer;
