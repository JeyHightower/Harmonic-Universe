import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { analyticsService } from '../../services/analyticsService';

const initialState = {
  metrics: {
    performance: [],
    errors: [],
    userActions: [],
    networkRequests: [],
  },
  filters: {
    startDate: null,
    endDate: null,
    type: 'all', // 'performance', 'errors', 'userActions', 'networkRequests'
    severity: 'all', // 'low', 'medium', 'high'
  },
  loading: false,
  error: null,
  lastUpdate: null,
};

export const fetchAnalytics = createAsyncThunk(
  'analytics/fetchAnalytics',
  async (filters, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getAnalytics(filters);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch analytics'
      );
    }
  }
);

export const exportAnalytics = createAsyncThunk(
  'analytics/exportAnalytics',
  async (format, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const filters = state.analytics.filters;
      const response = await analyticsService.exportAnalytics(filters, format);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to export analytics'
      );
    }
  }
);

export const logMetric = createAsyncThunk(
  'analytics/logMetric',
  async (metric, { rejectWithValue }) => {
    try {
      const response = await analyticsService.logMetric(metric);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to log metric'
      );
    }
  }
);

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearMetrics: state => {
      state.metrics = {
        performance: [],
        errors: [],
        userActions: [],
        networkRequests: [],
      };
    },
    addMetric: (state, action) => {
      const { type, data } = action.payload;
      if (state.metrics[type]) {
        state.metrics[type].push({
          ...data,
          timestamp: new Date().toISOString(),
        });
      }
    },
    clearError: state => {
      state.error = null;
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
        state.metrics = action.payload;
        state.lastUpdate = new Date().toISOString();
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Export Analytics
      .addCase(exportAnalytics.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(exportAnalytics.fulfilled, state => {
        state.loading = false;
      })
      .addCase(exportAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Log Metric
      .addCase(logMetric.fulfilled, (state, action) => {
        const { type, data } = action.payload;
        if (state.metrics[type]) {
          state.metrics[type].push(data);
        }
      });
  },
});

export const { setFilters, clearMetrics, addMetric, clearError } =
  analyticsSlice.actions;

export const selectMetrics = state => state.analytics.metrics;
export const selectFilters = state => state.analytics.filters;
export const selectAnalyticsLoading = state => state.analytics.loading;
export const selectAnalyticsError = state => state.analytics.error;
export const selectLastUpdate = state => state.analytics.lastUpdate;

export default analyticsSlice.reducer;
