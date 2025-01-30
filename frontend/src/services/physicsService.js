import api from './api';

const physicsService = {
  // Physics Objects
  createPhysicsObject: async (data) => {
    try {
      const response = await api.post('/api/physics/objects', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getPhysicsObject: async (objectId) => {
    try {
      const response = await api.get(`/api/physics/objects/${objectId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  updatePhysicsObject: async (objectId, data) => {
    try {
      const response = await api.put(`/api/physics/objects/${objectId}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  deletePhysicsObject: async (objectId) => {
    try {
      await api.delete(`/api/physics/objects/${objectId}`);
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Physics Constraints
  createPhysicsConstraint: async (data) => {
    try {
      const response = await api.post('/api/physics/constraints', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getPhysicsConstraint: async (constraintId) => {
    try {
      const response = await api.get(`/api/physics/constraints/${constraintId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  updatePhysicsConstraint: async (constraintId, data) => {
    try {
      const response = await api.put(`/api/physics/constraints/${constraintId}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  deletePhysicsConstraint: async (constraintId) => {
    try {
      await api.delete(`/api/physics/constraints/${constraintId}`);
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Scene Simulation
  simulateScene: async (sceneId) => {
    try {
      const response = await api.post(`/api/physics/scenes/${sceneId}/simulate`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default physicsService;
