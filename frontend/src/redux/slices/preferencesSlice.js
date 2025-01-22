import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from '../../services/api';

// Async thunks
export const fetchPreferences = createAsyncThunk(
  'preferences/fetchPreferences',
  async () => {
    const response = await axios.get('/api/preferences');
    return response.data;
  }
);

export const updatePreferences = createAsyncThunk(
  'preferences/updatePreferences',
  async preferences => {
    const response = await axios.put('/api/preferences', preferences);
    return response.data;
  }
);

const preferencesSlice = createSlice({
  name: 'preferences',
  initialState: {
    theme: 'light',
    emailNotifications: true,
    pushNotifications: true,
    highContrast: false,
    fontSize: 16,
    dashboardLayout: 'grid',
    language: 'en',
    timezone: 'UTC',
    loading: false,
    error: null,
  },
  reducers: {
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      // Fetch preferences
      .addCase(fetchPreferences.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPreferences.fulfilled, (state, action) => {
        state.loading = false;
        return { ...state, ...action.payload };
      })
      .addCase(fetchPreferences.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Update preferences
      .addCase(updatePreferences.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePreferences.fulfilled, (state, action) => {
        state.loading = false;
        return { ...state, ...action.payload };
      })
      .addCase(updatePreferences.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { setTheme } = preferencesSlice.actions;

export default preferencesSlice.reducer;
