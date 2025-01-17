import api from './api';

export const commentService = {
  async getComments(universeId) {
    const response = await api.get(`/universes/${universeId}/comments`);
    return response.data;
  },

  async addComment(universeId, content, parentId = null) {
    const response = await api.post(`/universes/${universeId}/comments`, {
      content,
      parent_id: parentId,
    });
    return response.data;
  },

  async updateComment(universeId, commentId, content) {
    const response = await api.put(
      `/universes/${universeId}/comments/${commentId}`,
      {
        content,
      }
    );
    return response.data;
  },

  async deleteComment(universeId, commentId) {
    const response = await api.delete(
      `/universes/${universeId}/comments/${commentId}`
    );
    return response.data;
  },
};
