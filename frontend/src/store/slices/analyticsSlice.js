import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

export const fetchAnalytics = createAsyncThunk(
  'analytics/fetchAnalytics',
  async universeId => {
    const response = await fetch(`/api/universes/${universeId}/analytics`);
    if (!response.ok) {
      throw new Error('Failed to fetch analytics');
    }
    return response.json();
  }
);

export const exportAnalytics = createAsyncThunk(
  'analytics/exportAnalytics',
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

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState: {
    data: null,
    loading: false,
    error: null,
    export: {
      loading: false,
      error: null,
      success: false,
    },
  },
  reducers: {
    clearAnalytics: state => {
      state.data = null;
      state.loading = false;
      state.error = null;
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
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
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

export const { clearAnalytics, clearExport } = analyticsSlice.actions;
export default analyticsSlice.reducer;
