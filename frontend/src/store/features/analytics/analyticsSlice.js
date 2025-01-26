import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

// Async thunks
export const fetchAnalytics = createAsyncThunk(
  "analytics/fetchAnalytics",
  async (_, { rejectWithValue }) => {
    try {
      // Mock data for now
      return {
        totalViews: 1000,
        activeParticipants: 500,
        avgSessionDuration: 300,
        engagementRate: 0.75,
        trends: {
          views: 5,
          participants: 10,
          sessionDuration: -2,
          engagement: 3,
        },
        demographics: {
          "Age 18-24": 30,
          "Age 25-34": 45,
          "Age 35-44": 25,
        },
        features: [
          { name: "Feature 1", count: 50 },
          { name: "Feature 2", count: 30 },
        ],
        activityData: [
          { date: "2024-01-01", count: 100 },
          { date: "2024-01-02", count: 150 },
          { date: "2024-01-03", count: 120 },
        ],
        recentActivity: [
          {
            timestamp: "2024-01-01T10:00:00",
            user: "User 1",
            action: "Created",
            details: "New universe",
          },
        ],
        topContributors: [
          { username: "User 1", contributions: 50, lastActive: "12/31/2023" },
        ],
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

const initialState = {
  data: null,
  loading: false,
  error: null,
};

const analyticsSlice = createSlice({
  name: "analytics",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.error = null;
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = analyticsSlice.actions;
export const analyticsReducer = analyticsSlice.reducer;
export default analyticsReducer;
