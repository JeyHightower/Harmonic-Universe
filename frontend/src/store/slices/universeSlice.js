import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

// Async thunks
export const fetchAnalytics = createAsyncThunk(
  'universe/fetchAnalytics',
  async universeId => {
    const response = await fetch(`/api/universes/${universeId}/analytics`);
    if (!response.ok) {
      throw new Error('Failed to fetch analytics');
    }
    return response.json();
  }
);

export const exportAnalytics = createAsyncThunk(
  'universe/exportAnalytics',
  async universeId => {
    const response = await fetch(
      `/api/universes/${universeId}/analytics/export`
    );
    if (!response.ok) {
      throw new Error('Failed to export analytics');
    }
    return response.json();
  }
);

const universeSlice = createSlice({
  name: 'universe',
  initialState: {
    analytics: {
      data: null,
      loading: false,
      error: null,
    },
    export: {
      loading: false,
      error: null,
      success: false,
    },
  },
  reducers: {
    clearAnalytics: state => {
      state.analytics = {
        data: null,
        loading: false,
        error: null,
      };
    },
    clearExport: state => {
      state.export = {
        loading: false,
        error: null,
        success: false,
      };
    },
  },
  extraReducers: builder => {
    builder
      // Fetch Analytics
      .addCase(fetchAnalytics.pending, state => {
        state.analytics.loading = true;
        state.analytics.error = null;
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.analytics.loading = false;
        state.analytics.data = action.payload;
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        state.analytics.loading = false;
        state.analytics.error = action.error.message;
      })
      // Export Analytics
      .addCase(exportAnalytics.pending, state => {
        state.export.loading = true;
        state.export.error = null;
        state.export.success = false;
      })
      .addCase(exportAnalytics.fulfilled, state => {
        state.export.loading = false;
        state.export.success = true;
      })
      .addCase(exportAnalytics.rejected, (state, action) => {
        state.export.loading = false;
        state.export.error = action.error.message;
      });
  },
});

export const { clearAnalytics, clearExport } = universeSlice.actions;
export default universeSlice.reducer;
