import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { musicService } from '../../services/musicService';

// Async thunks
export const fetchMusicParameters = createAsyncThunk(
  'music/fetchParameters',
  async universeId => {
    const response = await musicService.getMusicParameters(universeId);
    return response;
  }
);

export const updateMusicParameters = createAsyncThunk(
  'music/updateParameters',
  async ({ universeId, parameters }) => {
    const response = await musicService.updateMusicParameters(
      universeId,
      parameters
    );
    return response;
  }
);

export const exportAudio = createAsyncThunk(
  'music/exportAudio',
  async ({ universeId, format }) => {
    const response = await musicService.exportAudio(universeId, format);
    return response;
  }
);

const initialState = {
  parameters: {
    tempo: 120,
    key: 'C',
    scale: 'major',
    volume: 0.8,
    waveform: 'sine',
    harmonics: [],
    reverb: 0.3,
    delay: 0.2,
    filterFreq: 1000,
    filterResonance: 0.1,
    sequencePattern: [],
    sequenceLength: 16,
  },
  status: 'idle',
  error: null,
  audioBlob: null,
  presets: [],
  activePresetId: null,
};

const musicSlice = createSlice({
  name: 'music',
  initialState,
  reducers: {
    setParameter: (state, action) => {
      const { name, value } = action.payload;
      state.parameters[name] = value;
    },
    resetParameters: state => {
      state.parameters = initialState.parameters;
    },
    setActivePreset: (state, action) => {
      state.activePresetId = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchMusicParameters.pending, state => {
        state.status = 'loading';
      })
      .addCase(fetchMusicParameters.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.parameters = action.payload;
      })
      .addCase(fetchMusicParameters.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(updateMusicParameters.fulfilled, (state, action) => {
        state.parameters = action.payload;
      })
      .addCase(exportAudio.fulfilled, (state, action) => {
        state.audioBlob = action.payload;
      });
  },
});

export const { setParameter, resetParameters, setActivePreset } =
  musicSlice.actions;
export default musicSlice.reducer;
