import { createAsyncThunk } from '@reduxjs/toolkit';

export const fetchAnalytics = createAsyncThunk(
  'analytics/fetchAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      // Mock API call for now
      const mockData = {
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
          'Age 18-24': 30,
          'Age 25-34': 45,
          'Age 35-44': 25,
        },
        features: [
          { name: 'Feature 1', count: 50 },
          { name: 'Feature 2', count: 30 },
        ],
        activityData: [
          { date: '2024-01-01', count: 100 },
          { date: '2024-01-02', count: 150 },
          { date: '2024-01-03', count: 120 },
        ],
        recentActivity: [
          {
            timestamp: '2024-01-01T10:00:00',
            user: 'User 1',
            action: 'Created',
            details: 'New universe',
          },
        ],
        topContributors: [
          { username: 'User 1', contributions: 50, lastActive: '12/31/2023' },
        ],
      };

      return mockData;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);
