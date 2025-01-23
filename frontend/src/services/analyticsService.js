import api from './api';

export const analyticsService = {
  async getAnalytics(universeId) {
    try {
      const response = await api.get(`/api/universes/${universeId}/analytics`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch analytics'
      );
    }
  },

  async exportAnalytics(universeId, format = 'json') {
    try {
      const response = await api.get(
        `/api/universes/${universeId}/analytics/export?format=${format}`,
        {
          responseType: 'blob',
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to export analytics'
      );
    }
  },

  async getMetrics(universeId, timeRange = '7d') {
    try {
      const response = await api.get(
        `/api/universes/${universeId}/analytics/metrics`,
        {
          params: { timeRange },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch metrics'
      );
    }
  },

  async getActivityTimeline(universeId, timeRange = '7d') {
    try {
      const response = await api.get(
        `/api/universes/${universeId}/analytics/timeline`,
        {
          params: { timeRange },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch activity timeline'
      );
    }
  },
};
