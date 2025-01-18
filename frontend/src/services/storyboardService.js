import api from './api';

export const storyboardService = {
  getStoryboards: async (universeId, params) => {
    try {
      const { page, limit, sort, order, filter } = params;
      const response = await api.get(
        `/api/universes/${universeId}/storyboards`,
        {
          params: {
            page,
            limit,
            sort,
            order,
            filter,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch storyboards'
      );
    }
  },

  createStoryboard: async (universeId, storyboard) => {
    try {
      const response = await api.post(
        `/api/universes/${universeId}/storyboards`,
        storyboard
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to create storyboard'
      );
    }
  },

  updateStoryboard: async (universeId, storyboardId, storyboard) => {
    try {
      const response = await api.put(
        `/api/universes/${universeId}/storyboards/${storyboardId}`,
        storyboard
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to update storyboard'
      );
    }
  },

  deleteStoryboard: async (universeId, storyboardId) => {
    try {
      await api.delete(
        `/api/universes/${universeId}/storyboards/${storyboardId}`
      );
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to delete storyboard'
      );
    }
  },

  // Additional storyboard-related API calls
  generateThumbnail: async (universeId, storyboardId) => {
    try {
      const response = await api.post(
        `/api/universes/${universeId}/storyboards/${storyboardId}/thumbnail`
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to generate thumbnail'
      );
    }
  },

  exportStoryboard: async (universeId, storyboardId, format = 'pdf') => {
    try {
      const response = await api.get(
        `/api/universes/${universeId}/storyboards/${storyboardId}/export`,
        {
          params: { format },
          responseType: 'blob',
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to export storyboard'
      );
    }
  },
};
