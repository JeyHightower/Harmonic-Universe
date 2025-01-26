import api from "./api";

export const commentService = {
  async getComments(universeId) {
    const response = await api.get(`/api/comments/${universeId}`);
    return response.data;
  },

  async addComment(universeId, content, parentId = null) {
    const response = await api.post(`/api/comments/${universeId}`, {
      content,
      parent_id: parentId,
    });
    return response.data;
  },

  async updateComment(universeId, commentId, content) {
    const response = await api.put(`/api/comments/${commentId}`, {
      content,
    });
    return response.data;
  },

  async deleteComment(universeId, commentId) {
    const response = await api.delete(`/api/comments/${commentId}`);
    return response.data;
  },
};
