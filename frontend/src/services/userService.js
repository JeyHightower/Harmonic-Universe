import api from './api';

export const userService = {
  async searchUsers(query) {
    const response = await api.get(
      `/users/search?q=${encodeURIComponent(query)}`
    );
    return response.data;
  },

  async getUsersByIds(userIds) {
    const response = await api.post('/users/batch', { userIds });
    return response.data;
  },
};
